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
    cb.addEventListener("change", updateGroupByOptions);
    var span = document.createElement("span");
    span.textContent = getTopicTitle(topic);
    lbl.appendChild(cb);
    lbl.appendChild(span);
    container.appendChild(lbl);
  });

  updateGroupByOptions();
}

// ── Update Group By dropdown based on selected assessments ──

function updateGroupByOptions() {
  var select = document.getElementById("group-mode");
  var currentValue = select.value;

  // Get selected assessment topics
  var checkboxes = document.querySelectorAll("#assessment-options input[type='checkbox']");
  var selectedTopics = [];
  checkboxes.forEach(function (cb) {
    if (cb.checked) selectedTopics.push(cb.value);
  });

  // Rebuild options
  select.innerHTML = '<option value="__all__">All Questions</option>';

  selectedTopics.forEach(function (topic) {
    var skillGroups = getSkillGroups(topic);
    var topicTitle = getTopicTitle(topic);
    var hasMultipleTopics = selectedTopics.length > 1;

    skillGroups.forEach(function (sg) {
      var opt = document.createElement("option");
      opt.value = topic + "::" + sg.skill;
      opt.textContent = hasMultipleTopics
        ? sg.skill + " (" + topicTitle + ")"
        : sg.skill;
      select.appendChild(opt);
    });
  });

  // Try to restore previous selection
  var found = false;
  for (var i = 0; i < select.options.length; i++) {
    if (select.options[i].value === currentValue) {
      select.value = currentValue;
      found = true;
      break;
    }
  }
  if (!found) select.value = "__all__";
}

// ── Group Generation Logic ───────────────────────────────

// Groups use format: { skills: [{ topic, skill, questionIds }], students: [{ id, name, allAnswers }] }

function generateGroups() {
  var periodValue = document.getElementById("period-filter").value;
  var groupMode = document.getElementById("group-mode").value;
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
    roster.forEach(function (s) {
      if (s.loginId) includedStudents[s.loginId] = true;
    });
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

  // Build all groups (one per sub-skill)
  var groups = buildAllGroups(selectedTopics, includedStudents, latestResults, nameMap);

  // If a specific sub-skill is selected, filter to just that group
  if (groupMode !== "__all__") {
    groups = groups.filter(function (g) {
      var key = g.skills[0].topic + "::" + g.skills[0].skill;
      return key === groupMode;
    });
  }

  window._lastGroups = groups;
  renderGroups(groups);
}

// Build one group per sub-skill across selected topics
function buildAllGroups(selectedTopics, includedStudents, latestResults, nameMap) {
  var groups = [];

  selectedTopics.forEach(function (topic) {
    var skillGroups = getSkillGroups(topic);

    skillGroups.forEach(function (sg) {
      var needsReteach = [];

      Object.keys(includedStudents).forEach(function (studentId) {
        var studentResults = latestResults[studentId];
        if (!studentResults || !studentResults[topic]) return;

        var result = studentResults[topic];
        if (!result.answers) return;

        var answerMap = {};
        result.answers.forEach(function (a) {
          answerMap[a.questionId] = a.correct;
        });

        var allCorrect = true;
        var allAnswers = {};
        sg.questionIds.forEach(function (qId) {
          var isCorrect = answerMap[qId];
          allAnswers[topic + "_" + qId] = isCorrect;
          if (isCorrect !== true) allCorrect = false;
        });

        if (!allCorrect) {
          var name = nameMap[studentId] || studentId.replace(/_/g, " ");
          needsReteach.push({
            id: studentId,
            name: name,
            allAnswers: allAnswers
          });
        }
      });

      needsReteach.sort(function (a, b) {
        return a.name.localeCompare(b.name);
      });

      if (needsReteach.length > 0) {
        groups.push({
          skills: [{ topic: topic, skill: sg.skill, questionIds: sg.questionIds }],
          students: needsReteach
        });
      }
    });
  });

  return groups;
}

// ── Render Groups ────────────────────────────────────────

function renderGroups(groups) {
  var wrapper = document.getElementById("results-wrapper");
  var statsEl = document.getElementById("summary-stats");
  wrapper.innerHTML = "";
  statsEl.innerHTML = "";

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

  // Summary stats (inline in filter panel)
  var totalStudents = {};
  groups.forEach(function (g) {
    g.students.forEach(function (s) { totalStudents[s.id] = true; });
  });

  statsEl.innerHTML =
    '<div class="summary-stat"><span class="stat-number">' + groups.length + '</span><span class="stat-label">Groups</span></div>' +
    '<div class="summary-stat"><span class="stat-number">' + Object.keys(totalStudents).length + '</span><span class="stat-label">Students</span></div>';

  // Group cards
  groups.forEach(function (group) {
    var card = document.createElement("div");
    card.className = "group-card";

    var skill = group.skills[0];

    // Header
    var header = document.createElement("div");
    header.className = "group-header";
    header.innerHTML =
      '<div><span class="group-skill-name">' + escapeHTML(skill.skill) + '</span>' +
      '<span class="group-topic-label"> &mdash; ' + escapeHTML(getTopicTitle(skill.topic)) + '</span></div>' +
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

    skill.questionIds.forEach(function (qId) {
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

      skill.questionIds.forEach(function (qId) {
        var td = document.createElement("td");
        var answerKey = skill.topic + "_" + qId;
        var correct = student.allAnswers[answerKey];
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

    // Footer with Print Practice button
    var footer = document.createElement("div");
    footer.className = "group-footer";

    var practiceResources = getPracticeResources();
    var skillWorksheets = practiceResources.filter(function (r) {
      return r.topic === skill.topic && r.skill === skill.skill && r.type === "worksheet";
    });
    skillWorksheets.sort(function (a, b) { return a.order - b.order; });

    if (skillWorksheets.length > 0) {
      var btn = document.createElement("button");
      btn.className = "btn-practice";
      btn.innerHTML = "&#128424; Print Practice";
      btn.setAttribute("data-topic", skill.topic);
      btn.setAttribute("data-skill", skill.skill);
      btn.onclick = (function (g, ws) {
        return function () { printPractice(g, ws); };
      })(group, skillWorksheets);
      footer.appendChild(btn);

      var note = document.createElement("span");
      note.className = "practice-note";
      note.textContent = skillWorksheets.length + " worksheet" + (skillWorksheets.length !== 1 ? "s" : "") + " available";
      footer.appendChild(note);
    } else {
      var note = document.createElement("span");
      note.className = "practice-note";
      note.textContent = "No worksheets added yet \u2014 ";
      var link = document.createElement("a");
      link.href = "practice-resources.html";
      link.textContent = "add resources";
      link.style.color = "#0077cc";
      note.appendChild(link);
      footer.appendChild(note);
    }

    card.appendChild(footer);
    wrapper.appendChild(card);
  });
}

// ── Print Practice (auto-advance) ────────────────────────

function getPracticeResources() {
  return JSON.parse(localStorage.getItem("practiceResources") || "[]");
}

function getPracticeProgress() {
  return JSON.parse(localStorage.getItem("practiceProgress") || "[]");
}

function printPractice(group, worksheets) {
  var progress = getPracticeProgress();
  var completionMap = {};
  progress.forEach(function (p) {
    completionMap[p.studentId + "::" + p.resourceId] = true;
  });

  // Build assignment list: for each student, find next unfinished worksheet
  var assignments = [];
  group.students.forEach(function (student) {
    var nextWs = null;
    for (var i = 0; i < worksheets.length; i++) {
      if (!completionMap[student.id + "::" + worksheets[i].id]) {
        nextWs = worksheets[i];
        break;
      }
    }
    assignments.push({
      name: student.name,
      worksheet: nextWs
    });
  });

  // Open print window
  var win = window.open("", "_blank");
  var html = '<!DOCTYPE html><html><head><title>Practice Assignments</title>' +
    '<style>' +
    'body{font-family:"Century Gothic","Segoe UI",sans-serif;padding:30px;color:#333;}' +
    'h1{color:#4b0082;font-size:1.6rem;margin-bottom:4px;}' +
    'h2{color:#666;font-size:1rem;font-weight:400;margin-top:0;margin-bottom:24px;}' +
    'table{width:100%;border-collapse:collapse;font-size:0.9rem;}' +
    'th{background:#4b0082;color:white;padding:10px 16px;text-align:left;}' +
    'td{padding:10px 16px;border-bottom:1px solid #ddd;}' +
    'tr:nth-child(even){background:#f9f6ff;}' +
    '.all-done{color:#2e7d32;font-weight:600;}' +
    '.ws-link{color:#0077cc;}' +
    '@media print{body{padding:10px;} th{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}' +
    '</style></head><body>';

  html += '<h1>' + escapeHTML(group.skills[0].skill) + ' &mdash; Practice Assignments</h1>';
  html += '<h2>' + escapeHTML(getTopicTitle(group.skills[0].topic)) + '</h2>';

  html += '<table><thead><tr><th>Student</th><th>Assigned Worksheet</th><th>Link</th></tr></thead><tbody>';

  assignments.forEach(function (a) {
    html += '<tr><td>' + escapeHTML(a.name) + '</td>';
    if (a.worksheet) {
      html += '<td>' + escapeHTML(a.worksheet.title) + '</td>';
      html += '<td><a class="ws-link" href="' + escapeHTML(a.worksheet.url) + '">' + escapeHTML(a.worksheet.url) + '</a></td>';
    } else {
      html += '<td class="all-done" colspan="2">All worksheets completed!</td>';
    }
    html += '</tr>';
  });

  html += '</tbody></table>';
  html += '<script>window.print();<\/script>';
  html += '</body></html>';

  win.document.write(html);
  win.document.close();
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

  var rows = [["Sub-Skill", "Assessment", "Student", "Questions Missed"]];

  groups.forEach(function (group) {
    var skill = group.skills[0];

    group.students.forEach(function (student) {
      var missed = [];
      skill.questionIds.forEach(function (qId) {
        var answerKey = skill.topic + "_" + qId;
        if (student.allAnswers[answerKey] !== true) {
          missed.push("Q" + qId);
        }
      });
      rows.push([
        skill.skill,
        getTopicTitle(skill.topic),
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
