// Flourish & Fly – Progress Monitoring
// Track which practice worksheets each student has completed per skill.

// ── Data helpers ─────────────────────────────────────────

function getPracticeResources() {
  return JSON.parse(localStorage.getItem("practiceResources") || "[]");
}

function getPracticeProgress() {
  return JSON.parse(localStorage.getItem("practiceProgress") || "[]");
}

function savePracticeProgress(progress) {
  localStorage.setItem("practiceProgress", JSON.stringify(progress));
}

function getClassRoster() {
  return JSON.parse(localStorage.getItem("classRoster") || "[]");
}

function getStudentRoster() {
  return JSON.parse(localStorage.getItem("studentRoster") || "{}");
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

// ── Populate filters ─────────────────────────────────────

function populateFilters() {
  var roster = getClassRoster();

  // Periods
  var periodSelect = document.getElementById("pm-period");
  var periods = {};
  roster.forEach(function (s) {
    if (s.classPeriod && s.classPeriod.trim() !== "") {
      periods[s.classPeriod.trim()] = true;
    }
  });
  Object.keys(periods).sort().forEach(function (p) {
    var opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    periodSelect.appendChild(opt);
  });

  // Skills
  var skillSelect = document.getElementById("pm-skill");
  if (typeof questionBank !== "undefined") {
    Object.keys(questionBank).forEach(function (topic) {
      var topicTitle = getTopicTitle(topic);
      var skills = getSkillGroups(topic);
      var multi = Object.keys(questionBank).length > 1;
      skills.forEach(function (sg) {
        var opt = document.createElement("option");
        opt.value = topic + "::" + sg.skill;
        opt.textContent = multi ? sg.skill + " (" + topicTitle + ")" : sg.skill;
        skillSelect.appendChild(opt);
      });
    });
  }

  periodSelect.addEventListener("change", renderProgress);
  skillSelect.addEventListener("change", renderProgress);
}

// ── Build completion map ─────────────────────────────────

function buildCompletionMap() {
  var progress = getPracticeProgress();
  var map = {}; // "studentId::resourceId" -> true
  progress.forEach(function (p) {
    map[p.studentId + "::" + p.resourceId] = true;
  });
  return map;
}

// ── Render progress ──────────────────────────────────────

function renderProgress() {
  var container = document.getElementById("progress-content");
  container.innerHTML = "";

  var periodValue = document.getElementById("pm-period").value;
  var skillValue = document.getElementById("pm-skill").value;

  var resources = getPracticeResources();
  var completionMap = buildCompletionMap();
  var roster = getClassRoster();
  var nameMap = getStudentRoster();

  // Get students for selected period
  var students = [];
  roster.forEach(function (s) {
    if (!s.loginId) return;
    if (periodValue !== "__all__" && (!s.classPeriod || s.classPeriod.trim() !== periodValue)) return;
    var name = nameMap[s.loginId] || s.loginId.replace(/_/g, " ");
    students.push({ id: s.loginId, name: name });
  });
  students.sort(function (a, b) { return a.name.localeCompare(b.name); });

  if (students.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">&#128203;</div>' +
      '<p>No students found. Add students to your class roster first.</p></div>';
    return;
  }

  // Determine which skills to show
  var skillList = [];
  if (skillValue === "__all__") {
    if (typeof questionBank !== "undefined") {
      Object.keys(questionBank).forEach(function (topic) {
        getSkillGroups(topic).forEach(function (sg) {
          skillList.push({ topic: topic, skill: sg.skill });
        });
      });
    }
  } else {
    var parts = skillValue.split("::");
    skillList.push({ topic: parts[0], skill: parts[1] });
  }

  // Filter to skills that have resources
  var skillsWithResources = skillList.filter(function (sk) {
    return resources.some(function (r) {
      return r.topic === sk.topic && r.skill === sk.skill;
    });
  });

  if (skillsWithResources.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">&#128218;</div>' +
      '<p>No practice resources have been added yet.</p>' +
      '<p style="font-weight:400;color:#666;font-size:0.95rem;margin-top:8px;">' +
      '<a href="practice-resources.html" style="color:#0077cc;">Add resources</a> to start tracking progress.</p></div>';
    return;
  }

  // Render a card per skill
  skillsWithResources.forEach(function (sk) {
    var skillResources = resources.filter(function (r) {
      return r.topic === sk.topic && r.skill === sk.skill;
    });
    skillResources.sort(function (a, b) { return a.order - b.order; });

    var worksheets = skillResources.filter(function (r) { return r.type === "worksheet"; });
    if (worksheets.length === 0) return; // only track worksheets for progress

    var card = document.createElement("div");
    card.className = "progress-card";

    // Header
    var header = document.createElement("div");
    header.className = "progress-card-header";

    var totalComplete = 0;
    var totalCells = students.length * worksheets.length;
    students.forEach(function (st) {
      worksheets.forEach(function (ws) {
        if (completionMap[st.id + "::" + ws.id]) totalComplete++;
      });
    });

    header.innerHTML = '<h3>' + escapeHTML(sk.skill) +
      ' <span style="opacity:0.7;font-weight:400;font-size:0.85rem;">&mdash; ' +
      escapeHTML(getTopicTitle(sk.topic)) + '</span></h3>' +
      '<span class="badge">' + totalComplete + ' / ' + totalCells + ' completed</span>';
    card.appendChild(header);

    // Table
    var table = document.createElement("table");
    table.className = "progress-table";

    var thead = document.createElement("thead");
    var headRow = document.createElement("tr");
    var nameTh = document.createElement("th");
    nameTh.textContent = "Student";
    headRow.appendChild(nameTh);

    worksheets.forEach(function (ws, wsIdx) {
      var th = document.createElement("th");
      th.style.textAlign = "center";
      th.textContent = ws.title.length > 20 ? ws.title.substr(0, 18) + "..." : ws.title;
      th.title = ws.title;
      headRow.appendChild(th);
    });

    var nextTh = document.createElement("th");
    nextTh.style.textAlign = "center";
    nextTh.textContent = "Next Up";
    headRow.appendChild(nextTh);
    thead.appendChild(headRow);
    table.appendChild(thead);

    var tbody = document.createElement("tbody");

    students.forEach(function (student) {
      var tr = document.createElement("tr");

      var nameTd = document.createElement("td");
      nameTd.className = "student-name-col";
      nameTd.textContent = student.name;
      tr.appendChild(nameTd);

      var nextWorksheet = null;

      worksheets.forEach(function (ws) {
        var td = document.createElement("td");
        td.className = "worksheet-cell";
        var isComplete = completionMap[student.id + "::" + ws.id];

        if (isComplete) {
          td.className += " ws-complete";
          td.innerHTML = '<button class="btn-toggle checked" onclick="toggleProgress(\'' +
            student.id + "','" + ws.id + "')\" title=\"Mark incomplete\">&#10003;</button>";
        } else {
          if (!nextWorksheet) nextWorksheet = ws;
          td.className += " ws-pending";
          td.innerHTML = '<button class="btn-toggle" onclick="toggleProgress(\'' +
            student.id + "','" + ws.id + "')\" title=\"Mark complete\">&mdash;</button>";
        }
        tr.appendChild(td);
      });

      var nextTd = document.createElement("td");
      nextTd.className = "worksheet-cell";
      if (nextWorksheet) {
        nextTd.className += " ws-next";
        nextTd.textContent = nextWorksheet.title.length > 20
          ? nextWorksheet.title.substr(0, 18) + "..."
          : nextWorksheet.title;
        nextTd.title = nextWorksheet.title;
      } else {
        nextTd.className += " ws-complete";
        nextTd.textContent = "All done!";
      }
      tr.appendChild(nextTd);

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    card.appendChild(table);
    container.appendChild(card);
  });
}

// ── Toggle completion ────────────────────────────────────

function toggleProgress(studentId, resourceId) {
  var progress = getPracticeProgress();
  var key = studentId + "::" + resourceId;
  var existing = -1;

  for (var i = 0; i < progress.length; i++) {
    if (progress[i].studentId === studentId && progress[i].resourceId === resourceId) {
      existing = i;
      break;
    }
  }

  if (existing >= 0) {
    progress.splice(existing, 1);
  } else {
    progress.push({
      studentId: studentId,
      resourceId: resourceId,
      completedDate: new Date().toISOString().split("T")[0]
    });
  }

  savePracticeProgress(progress);
  renderProgress();
}

function escapeHTML(str) {
  var div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ── Init ─────────────────────────────────────────────────

window.addEventListener("DOMContentLoaded", function () {
  populateFilters();
  renderProgress();
});
