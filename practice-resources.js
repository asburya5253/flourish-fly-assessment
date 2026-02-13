// Flourish & Fly – Practice Resources Manager
// Teachers add worksheets and links aligned to each sub-skill.

// ── Data helpers ─────────────────────────────────────────

function getPracticeResources() {
  return JSON.parse(localStorage.getItem("practiceResources") || "[]");
}

function savePracticeResources(resources) {
  localStorage.setItem("practiceResources", JSON.stringify(resources));
}

function generateId() {
  return "res_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);
}

function getTopicTitle(topic) {
  if (typeof questionBank !== "undefined" && questionBank[topic] && questionBank[topic].title) {
    return questionBank[topic].title;
  }
  return topic.charAt(0).toUpperCase() + topic.slice(1);
}

function getSkillGroups(topic) {
  if (typeof questionBank === "undefined" || !questionBank[topic]) return [];
  var questions = questionBank[topic].questions;
  var groups = [];
  var currentSkill = null;
  questions.forEach(function (q) {
    if (q.skill !== currentSkill) {
      groups.push({ skill: q.skill });
      currentSkill = q.skill;
    }
  });
  return groups;
}

// ── Populate skill dropdown ──────────────────────────────

function populateSkills() {
  var select = document.getElementById("skill-select");
  if (typeof questionBank === "undefined") return;

  Object.keys(questionBank).forEach(function (topic) {
    var topicTitle = getTopicTitle(topic);
    var skills = getSkillGroups(topic);
    var hasMultipleTopics = Object.keys(questionBank).length > 1;

    skills.forEach(function (sg) {
      var opt = document.createElement("option");
      opt.value = topic + "::" + sg.skill;
      opt.textContent = hasMultipleTopics
        ? sg.skill + " (" + topicTitle + ")"
        : sg.skill;
      select.appendChild(opt);
    });
  });

  select.addEventListener("change", onSkillChange);
}

function onSkillChange() {
  var val = document.getElementById("skill-select").value;
  var addForm = document.getElementById("add-form");
  var listEl = document.getElementById("resource-list");

  if (!val) {
    addForm.style.display = "none";
    listEl.style.display = "none";
    document.getElementById("skill-count").textContent = "";
    return;
  }

  addForm.style.display = "block";
  listEl.style.display = "block";
  renderResources();
}

// ── Add resource ─────────────────────────────────────────

function addResource() {
  var skillVal = document.getElementById("skill-select").value;
  if (!skillVal) return;

  var title = document.getElementById("res-title").value.trim();
  var type = document.getElementById("res-type").value;
  var url = document.getElementById("res-url").value.trim();

  if (!title) { alert("Please enter a title."); return; }
  if (!url) { alert("Please enter a URL."); return; }

  var parts = skillVal.split("::");
  var topic = parts[0];
  var skill = parts[1];

  var resources = getPracticeResources();

  // Determine next order for this skill
  var skillResources = resources.filter(function (r) {
    return r.topic === topic && r.skill === skill;
  });
  var nextOrder = skillResources.length + 1;

  resources.push({
    id: generateId(),
    topic: topic,
    skill: skill,
    title: title,
    type: type,
    url: url,
    order: nextOrder
  });

  savePracticeResources(resources);

  // Clear form
  document.getElementById("res-title").value = "";
  document.getElementById("res-url").value = "";

  renderResources();
}

// ── Render resource list ─────────────────────────────────

function renderResources() {
  var skillVal = document.getElementById("skill-select").value;
  if (!skillVal) return;

  var parts = skillVal.split("::");
  var topic = parts[0];
  var skill = parts[1];

  var resources = getPracticeResources();
  var skillResources = resources.filter(function (r) {
    return r.topic === topic && r.skill === skill;
  });

  skillResources.sort(function (a, b) { return a.order - b.order; });

  var headerTitle = document.getElementById("list-header-title");
  headerTitle.textContent = skill + " Resources";

  var countEl = document.getElementById("skill-count");
  countEl.textContent = skillResources.length + " resource" + (skillResources.length !== 1 ? "s" : "");

  var container = document.getElementById("resource-items");
  container.innerHTML = "";

  if (skillResources.length === 0) {
    container.innerHTML = '<div class="empty-resources">No resources added yet. Use the form above to add worksheets or links.</div>';
    return;
  }

  skillResources.forEach(function (res, idx) {
    var item = document.createElement("div");
    item.className = "resource-item";

    var typeBadgeClass = res.type === "worksheet" ? "type-worksheet" : "type-link";
    var typeLabel = res.type === "worksheet" ? "Worksheet" : "Link";

    item.innerHTML =
      '<div class="resource-order">' + (idx + 1) + '</div>' +
      '<div class="resource-info">' +
        '<div class="resource-title">' + escapeHTML(res.title) + '</div>' +
        '<div class="resource-url"><a href="' + escapeHTML(res.url) + '" target="_blank">' + escapeHTML(res.url) + '</a></div>' +
      '</div>' +
      '<span class="resource-type-badge ' + typeBadgeClass + '">' + typeLabel + '</span>' +
      '<div class="resource-actions">' +
        '<button title="Move up" onclick="moveResource(\'' + res.id + '\', -1)">&#9650;</button>' +
        '<button title="Move down" onclick="moveResource(\'' + res.id + '\', 1)">&#9660;</button>' +
        '<button class="btn-delete" title="Delete" onclick="deleteResource(\'' + res.id + '\')">&#10005;</button>' +
      '</div>';

    container.appendChild(item);
  });
}

// ── Move / Delete ────────────────────────────────────────

function moveResource(id, direction) {
  var skillVal = document.getElementById("skill-select").value;
  var parts = skillVal.split("::");
  var topic = parts[0];
  var skill = parts[1];

  var resources = getPracticeResources();
  var skillResources = resources.filter(function (r) {
    return r.topic === topic && r.skill === skill;
  });
  skillResources.sort(function (a, b) { return a.order - b.order; });

  var idx = -1;
  for (var i = 0; i < skillResources.length; i++) {
    if (skillResources[i].id === id) { idx = i; break; }
  }

  var swapIdx = idx + direction;
  if (idx < 0 || swapIdx < 0 || swapIdx >= skillResources.length) return;

  // Swap orders
  var tempOrder = skillResources[idx].order;
  skillResources[idx].order = skillResources[swapIdx].order;
  skillResources[swapIdx].order = tempOrder;

  // Write back to main array
  var idToOrder = {};
  skillResources.forEach(function (r) { idToOrder[r.id] = r.order; });
  resources.forEach(function (r) {
    if (idToOrder[r.id] !== undefined) r.order = idToOrder[r.id];
  });

  savePracticeResources(resources);
  renderResources();
}

function deleteResource(id) {
  var resources = getPracticeResources();
  resources = resources.filter(function (r) { return r.id !== id; });

  // Re-number orders for this skill
  var skillVal = document.getElementById("skill-select").value;
  var parts = skillVal.split("::");
  var topic = parts[0];
  var skill = parts[1];

  var skillResources = resources.filter(function (r) {
    return r.topic === topic && r.skill === skill;
  });
  skillResources.sort(function (a, b) { return a.order - b.order; });
  skillResources.forEach(function (r, i) { r.order = i + 1; });

  savePracticeResources(resources);
  renderResources();
}

function escapeHTML(str) {
  var div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ── Init ─────────────────────────────────────────────────

window.addEventListener("DOMContentLoaded", function () {
  populateSkills();
});
