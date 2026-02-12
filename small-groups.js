// Flourish & Fly – Small Groups Generator
// Analyzes sub-skill mastery to create reteaching groups.

// ── Helpers ──────────────────────────────────────────────

function getTopicTitle(topic) {
  if (typeof questionBank !== "undefined" && questionBank[topic] && questionBank[topic].title) {
    return questionBank[topic].title;
  }
  return topic.charAt(0).toUpperCase() + topic.slice(1);
}

function getQuestionsForTopic(topic) {
  if (typeof questionBank === "undefined" || !questionBank[topic]) return [];
  return questionBank[topic].questions;
}

function getSkillGroups(topic) {
  if (typeof questionBank === "undefined" || !questionBank[topic]) return [];
  var questions = questionBank[topic].questions;
  var groups = [];
  var currentSkill = null;
  questions.forEach(function (q) {
    if (q.skill !== currentSkill) {
      groups.push({ skill: q.skill, questionIds: [q.id] });
      currentSkill = q.skill;
    } else {
      groups[groups.length - 1].questionIds.push(q.id);
    }
  });
  return groups;
}

// ── Data Loading ─────────────────────────────────────────

function getClassRoster() {
  return JSON.parse(localStorage.getItem("classRoster") || "[]");
}

function getAssessmentResults() {
  return JSON.parse(localStorage.getItem("assessmentResults") || "[]");
}

function getStudentRoster() {
  return JSON.parse(localStorage.getItem("studentRoster") || "{}");
}

// Get the most recent result per student per topic
function getLatestResults() {
  var results = getAssessmentResults();
  var map = {}; // studentId -> topic -> result

  results.forEach(function (r) {
    if (!map[r.studentId]) map[r.studentId] = {};
    var existing = map[r.studentId][r.topic];
    if (!existing || new Date(r.date) > new Date(existing.date)) {
      map[r.studentId][r.topic] = r;
    }
  });

  return map;
}

// ── Populate Filters ─────────────────────────────────────

function populateFilters() {
  var roster = getClassRoster();
  var results = getAssessmentResults();

  // Class periods
  var periodSelect = document.getElementById("period-filter");
  var periods = {};
  roster.forEach(function (s) {
    if (s.classPeriod && s.classPeriod.trim() !== "") {
      periods[s.classPeriod.trim()] = true;
    }
  });

  periodSelect.innerHTML = '<option value="__all__">All Students</option>';
  Object.keys(periods).sort().forEach(function (p) {
    var opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    periodSelect.appendChild(opt);
  });

  // Available assessments (from questionBank topics that have results)
  var topicsWithData = {};
  results.forEach(function (r) {
    topicsWithData[r.topic] = true;
  });

  var container = document.getElementById("assessment-options");
  container.innerHTML = "";

  // Also include topics from questionBank even without data (they just won't produce groups)
  var allTopics = {};
  if (typeof questionBank !== "undefined") {
    Object.keys(questionBank).forEach(function (t) { allTopics[t] = true; });
  }
  Object.keys(topicsWithData).forEach(function (t) { allTopics[t] = true; });

  Object.keys(allTopics).forEach(function (topic) {
    var lbl = document.createElement("label");
    var cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = topic;
    cb.checked = !!topicsWithData[topic]; // pre-check if data exists
    var span = document.createElement("span");
    span.textContent = getTopicTitle(topic);
    lbl.appendChild(cb);
    lbl.appendChild(span);
    container.appendChild(lbl);
  });
}

// ── Group Generation Logic ───────────────────────────────

function generateGroups() {
  var periodValue = document.getElementById("period-filter").value;
  var roster = getClassRoster();
  var nameMap = getStudentRoster(); // loginId -> "First Last"
  var latestResults = getLatestResults();

  // Get selected assessments
  var checkboxes = document.querySelectorAll("#assessment-options input[type='checkbox']");
  var selectedTopics = [];
  checkboxes.forEach(function (cb) {
    if (cb.checked) selectedTopics.push(cb.value);
  });

  if (selectedTopics.length === 0) {
    var wrapper = document.getElementById("results-wrapper");
    wrapper.innerHTML = '<div class="empty-state"><div class="empty-icon">&#9888;&#65039;</div>' +
      '<p>Please select at least one assessment.</p></div>';
    document.getElementById("action-bar").style.display = "none";
    return;
  }

  // Build set of student loginIds to include based on period filter
  var includedStudents = {};
  if (periodValue === "__all__") {
    // Include everyone who has results
    roster.forEach(function (s) {
      if (s.loginId) includedStudents[s.loginId] = true;
    });
    // Also include anyone with results not in roster
    Object.keys(latestResults).forEach(function (sid) {
      includedStudents[sid] = true;
    });
  } else {
    roster.forEach(function (s) {
      if (s.loginId && s.classPeriod && s.classPeriod.trim() === periodValue) {
        includedStudents[s.loginId] = true;
      }
    });
  }

  // For each topic + sub-skill, find students who did NOT master it
  // "Not mastered" = got at least one question wrong in that sub-skill
  var groups = []; // { topic, skill, questionIds, students: [{ id, name, answers: {qId: bool} }] }

  selectedTopics.forEach(function (topic) {
    var skillGroups = getSkillGroups(topic);

    skillGroups.forEach(function (sg) {
      var needsReteach = [];

      Object.keys(includedStudents).forEach(function (studentId) {
        var studentResults = latestResults[studentId];
        if (!studentResults || !studentResults[topic]) return;

        var result = studentResults[topic];
        if (!result.answers) return;

        // Build answer lookup
        var answerMap = {};
        result.answers.forEach(function (a) {
          answerMap[a.questionId] = a.correct;
        });

        // Check if any question in this sub-skill was answered incorrectly
        var allCorrect = true;
        var studentAnswers = {};
        sg.questionIds.forEach(function (qId) {
          var isCorrect = answerMap[qId];
          studentAnswers[qId] = isCorrect;
          if (isCorrect !== true) allCorrect = false;
        });

        if (!allCorrect) {
          var name = nameMap[studentId] || studentId.replace(/_/g, " ");
          needsReteach.push({
            id: studentId,
            name: name,
            answers: studentAnswers
          });
        }
      });

      // Sort students alphabetically
      needsReteach.sort(function (a, b) {
        return a.name.localeCompare(b.name);
      });

      if (needsReteach.length > 0) {
        groups.push({
          topic: topic,
          skill: sg.skill,
          questionIds: sg.questionIds,
          students: needsReteach
        });
      }
    });
  });

  // Store for CSV download
  window._lastGroups = groups;

  renderGroups(groups);
}

// ── Render Groups ────────────────────────────────────────

function renderGroups(groups) {
  var wrapper = document.getElementById("results-wrapper");
  wrapper.innerHTML = "";

  if (groups.length === 0) {
    document.getElementById("action-bar").style.display = "none";
    var allGood = document.createElement("div");
    allGood.className = "no-groups";
    allGood.innerHTML = '<div class="check-icon">&#9989;</div>' +
      '<p>All students have mastered every sub-skill for the selected assessments!</p>' +
      '<p style="font-weight:400;color:#666;font-size:0.95rem;margin-top:8px;">No reteaching groups needed.</p>';
    wrapper.appendChild(allGood);
    return;
  }

  document.getElementById("action-bar").style.display = "flex";

  // Summary banner
  var totalStudents = {};
  groups.forEach(function (g) {
    g.students.forEach(function (s) { totalStudents[s.id] = true; });
  });

  var banner = document.createElement("div");
  banner.className = "summary-banner";
  banner.innerHTML =
    '<div class="summary-stat"><div class="stat-number">' + groups.length + '</div><div class="stat-label">Reteaching Groups</div></div>' +
    '<div class="summary-stat"><div class="stat-number">' + Object.keys(totalStudents).length + '</div><div class="stat-label">Students Need Support</div></div>';
  wrapper.appendChild(banner);

  // Group cards
  groups.forEach(function (group) {
    var card = document.createElement("div");
    card.className = "group-card";

    // Header
    var header = document.createElement("div");
    header.className = "group-header";
    header.innerHTML =
      '<div><span class="group-skill-name">' + escapeHTML(group.skill) + '</span>' +
      '<span class="group-topic-label"> &mdash; ' + escapeHTML(getTopicTitle(group.topic)) + '</span></div>' +
      '<span class="group-count">' + group.students.length + ' student' + (group.students.length !== 1 ? 's' : '') + '</span>';
    card.appendChild(header);

    // Body with mini-matrix
    var body = document.createElement("div");
    body.className = "group-body";

    var table = document.createElement("table");
    table.className = "group-matrix";

    // Thead: Student | Q# | Q# | ...
    var thead = document.createElement("thead");
    var headRow = document.createElement("tr");
    var nameTh = document.createElement("th");
    nameTh.textContent = "Student";
    headRow.appendChild(nameTh);

    group.questionIds.forEach(function (qId) {
      var th = document.createElement("th");
      th.textContent = "Q" + qId;
      headRow.appendChild(th);
    });

    thead.appendChild(headRow);
    table.appendChild(thead);

    // Tbody: rows per student
    var tbody = document.createElement("tbody");

    group.students.forEach(function (student) {
      var tr = document.createElement("tr");

      var nameTd = document.createElement("td");
      nameTd.textContent = student.name;
      tr.appendChild(nameTd);

      group.questionIds.forEach(function (qId) {
        var td = document.createElement("td");
        var correct = student.answers[qId];
        if (correct === true) {
          td.textContent = "1";
          td.className = "cell-correct";
        } else if (correct === false) {
          td.textContent = "0";
          td.className = "cell-incorrect";
        } else {
          td.textContent = "-";
          td.className = "cell-empty";
        }
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    body.appendChild(table);
    card.appendChild(body);
    wrapper.appendChild(card);
  });
}

function escapeHTML(str) {
  var div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ── CSV Download ─────────────────────────────────────────

function downloadGroupsCSV() {
  var groups = window._lastGroups;
  if (!groups || groups.length === 0) return;

  var rows = [["Reteaching Group (Sub-Skill)", "Assessment", "Student", "Questions Missed"]];

  groups.forEach(function (group) {
    group.students.forEach(function (student) {
      var missed = [];
      group.questionIds.forEach(function (qId) {
        if (student.answers[qId] !== true) {
          missed.push("Q" + qId);
        }
      });
      rows.push([
        group.skill,
        getTopicTitle(group.topic),
        student.name,
        missed.join("; ")
      ]);
    });
  });

  var csvContent = rows.map(function (row) {
    return row.map(function (cell) {
      var str = String(cell);
      if (str.indexOf(",") !== -1 || str.indexOf('"') !== -1) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    }).join(",");
  }).join("\n");

  var blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  var url = URL.createObjectURL(blob);
  var link = document.createElement("a");
  link.href = url;
  link.download = "reteaching-groups.csv";
  link.click();
  URL.revokeObjectURL(url);
}

// ── Init ─────────────────────────────────────────────────

window.addEventListener("DOMContentLoaded", function () {
  populateFilters();
});
