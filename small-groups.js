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

  // Step 1: For each student, determine which sub-skills they have NOT mastered
  // across all selected topics. Build a profile of failed skills per student.
  var studentProfiles = {}; // studentId -> { name, failedSkills: [{ topic, skill, questionIds }], allAnswers: {qId: bool} }

  Object.keys(includedStudents).forEach(function (studentId) {
    var failedSkills = [];
    var allAnswers = {};

    selectedTopics.forEach(function (topic) {
      var studentResults = latestResults[studentId];
      if (!studentResults || !studentResults[topic]) return;

      var result = studentResults[topic];
      if (!result.answers) return;

      var answerMap = {};
      result.answers.forEach(function (a) {
        answerMap[a.questionId] = a.correct;
      });

      var skillGroups = getSkillGroups(topic);
      skillGroups.forEach(function (sg) {
        var allCorrect = true;
        sg.questionIds.forEach(function (qId) {
          var isCorrect = answerMap[qId];
          allAnswers[topic + "_" + qId] = isCorrect;
          if (isCorrect !== true) allCorrect = false;
        });

        if (!allCorrect) {
          failedSkills.push({ topic: topic, skill: sg.skill, questionIds: sg.questionIds });
        }
      });
    });

    if (failedSkills.length > 0) {
      var name = nameMap[studentId] || studentId.replace(/_/g, " ");
      studentProfiles[studentId] = {
        id: studentId,
        name: name,
        failedSkills: failedSkills,
        allAnswers: allAnswers
      };
    }
  });

  // Step 2: Group students who share the exact same set of failed sub-skills.
  // Build a key from their sorted failed skill labels to cluster them.
  var clusterMap = {}; // key -> { skills: [...], students: [...] }

  Object.keys(studentProfiles).forEach(function (studentId) {
    var profile = studentProfiles[studentId];
    var skillLabels = profile.failedSkills.map(function (fs) {
      return fs.topic + "::" + fs.skill;
    });
    skillLabels.sort();
    var key = skillLabels.join("|");

    if (!clusterMap[key]) {
      clusterMap[key] = {
        skills: profile.failedSkills,
        students: []
      };
    }
    clusterMap[key].students.push(profile);
  });

  // Step 3: Convert to array sorted by group size (largest first)
  var groups = [];
  Object.keys(clusterMap).forEach(function (key) {
    var cluster = clusterMap[key];
    cluster.students.sort(function (a, b) {
      return a.name.localeCompare(b.name);
    });
    groups.push(cluster);
  });

  groups.sort(function (a, b) {
    return b.students.length - a.students.length;
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
  groups.forEach(function (group, groupIdx) {
    var card = document.createElement("div");
    card.className = "group-card";

    // Build skill list label for header
    var skillNames = group.skills.map(function (s) { return s.skill; });
    var uniqueSkillNames = [];
    var seen = {};
    skillNames.forEach(function (n) {
      if (!seen[n]) { uniqueSkillNames.push(n); seen[n] = true; }
    });
    var headerLabel = uniqueSkillNames.join(" + ");

    // Collect unique topic labels
    var topicLabels = [];
    var seenTopics = {};
    group.skills.forEach(function (s) {
      if (!seenTopics[s.topic]) {
        topicLabels.push(getTopicTitle(s.topic));
        seenTopics[s.topic] = true;
      }
    });

    // Header
    var header = document.createElement("div");
    header.className = "group-header";
    header.innerHTML =
      '<div><span class="group-skill-name">Group ' + (groupIdx + 1) + ': ' + escapeHTML(headerLabel) + '</span>' +
      '<span class="group-topic-label"> &mdash; ' + escapeHTML(topicLabels.join(", ")) + '</span></div>' +
      '<span class="group-count">' + group.students.length + ' student' + (group.students.length !== 1 ? 's' : '') + '</span>';
    card.appendChild(header);

    // Body with mini-matrix: sub-skill headers spanning question columns
    var body = document.createElement("div");
    body.className = "group-body";

    var table = document.createElement("table");
    table.className = "group-matrix";

    var thead = document.createElement("thead");

    // Row 1: Sub-skill names with colspan
    var subskillRow = document.createElement("tr");
    var cornerTh = document.createElement("th");
    cornerTh.rowSpan = 2;
    cornerTh.textContent = "Student";
    subskillRow.appendChild(cornerTh);

    group.skills.forEach(function (s) {
      var th = document.createElement("th");
      th.colSpan = s.questionIds.length;
      th.textContent = s.skill;
      th.style.fontSize = "0.75rem";
      subskillRow.appendChild(th);
    });
    thead.appendChild(subskillRow);

    // Row 2: Question numbers
    var qRow = document.createElement("tr");
    group.skills.forEach(function (s) {
      s.questionIds.forEach(function (qId) {
        var th = document.createElement("th");
        th.textContent = "Q" + qId;
        qRow.appendChild(th);
      });
    });
    thead.appendChild(qRow);
    table.appendChild(thead);

    // Tbody: rows per student
    var tbody = document.createElement("tbody");

    group.students.forEach(function (student) {
      var tr = document.createElement("tr");

      var nameTd = document.createElement("td");
      nameTd.textContent = student.name;
      tr.appendChild(nameTd);

      group.skills.forEach(function (s) {
        s.questionIds.forEach(function (qId) {
          var td = document.createElement("td");
          var answerKey = s.topic + "_" + qId;
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

  var rows = [["Group", "Sub-Skills Needing Reteach", "Assessment(s)", "Student", "Questions Missed"]];

  groups.forEach(function (group, idx) {
    var skillNames = [];
    var seenSkill = {};
    group.skills.forEach(function (s) {
      if (!seenSkill[s.skill]) { skillNames.push(s.skill); seenSkill[s.skill] = true; }
    });
    var topicNames = [];
    var seenTopic = {};
    group.skills.forEach(function (s) {
      if (!seenTopic[s.topic]) { topicNames.push(getTopicTitle(s.topic)); seenTopic[s.topic] = true; }
    });

    group.students.forEach(function (student) {
      var missed = [];
      group.skills.forEach(function (s) {
        s.questionIds.forEach(function (qId) {
          var answerKey = s.topic + "_" + qId;
          if (student.allAnswers[answerKey] !== true) {
            missed.push(s.skill + " Q" + qId);
          }
        });
      });
      rows.push([
        "Group " + (idx + 1),
        skillNames.join(" + "),
        topicNames.join(", "),
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
