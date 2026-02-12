// Flourish & Fly – Assessment Reports
// Matrix-based report: students as rows, questions as columns, sub-skill headers.

// ── Helpers ──────────────────────────────────────────────

function getTopicTitle(topic) {
  if (typeof questionBank !== "undefined" && questionBank[topic] && questionBank[topic].title) {
    return questionBank[topic].title;
  }
  return topic.charAt(0).toUpperCase() + topic.slice(1);
}

function getMasteryTextClass(mastery) {
  switch (mastery) {
    case "Mastered":     return "mastery-text-mastered";
    case "Needs Review": return "mastery-text-review";
    case "Full Reteach": return "mastery-text-reteach";
    default:             return "mastery-text-reteach";
  }
}

// ── Data Processing ──────────────────────────────────────

function getReportData() {
  var results = JSON.parse(localStorage.getItem("assessmentResults") || "[]");
  var roster = JSON.parse(localStorage.getItem("studentRoster") || "{}");

  // Group by studentId → topic, keeping only the most recent result per pair
  var studentMap = {};

  results.forEach(function (r) {
    if (!studentMap[r.studentId]) {
      studentMap[r.studentId] = {};
    }
    var existing = studentMap[r.studentId][r.topic];
    if (!existing || new Date(r.date) > new Date(existing.date)) {
      studentMap[r.studentId][r.topic] = r;
    }
  });

  // Convert to array
  var reportData = [];

  Object.keys(studentMap).forEach(function (studentId) {
    var studentName = roster[studentId] || studentId.replace(/_/g, " ");
    var topicResults = [];

    Object.keys(studentMap[studentId]).forEach(function (topic) {
      topicResults.push(studentMap[studentId][topic]);
    });

    topicResults.sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    });

    reportData.push({
      studentId: studentId,
      studentName: studentName,
      results: topicResults
    });
  });

  reportData.sort(function (a, b) {
    return a.studentName.localeCompare(b.studentName);
  });

  return reportData;
}

// ── Sub-skill Grouping (for questions in the bank) ──────

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

function getQuestionsForTopic(topic) {
  if (typeof questionBank === "undefined" || !questionBank[topic]) return [];
  return questionBank[topic].questions;
}

// ── Collect available topics from data ───────────────────

function getAvailableTopics(reportData) {
  var topicSet = {};
  reportData.forEach(function (student) {
    student.results.forEach(function (r) {
      topicSet[r.topic] = true;
    });
  });
  return Object.keys(topicSet);
}

// ── Matrix Builder ───────────────────────────────────────

function buildMatrix(students, topic) {
  var questions = getQuestionsForTopic(topic);
  var skillGroups = getSkillGroups(topic);

  if (questions.length === 0 || students.length === 0) return null;

  var scrollWrapper = document.createElement("div");
  scrollWrapper.className = "matrix-scroll";

  var table = document.createElement("table");
  table.className = "matrix-table";

  // ── THEAD ──
  var thead = document.createElement("thead");

  // Row 1: Sub-skill names (with colspan)
  var subskillRow = document.createElement("tr");
  subskillRow.className = "subskill-row";

  // Corner cell spans 2 rows
  var cornerTh = document.createElement("th");
  cornerTh.rowSpan = 2;
  cornerTh.textContent = "Student";
  subskillRow.appendChild(cornerTh);

  skillGroups.forEach(function (group) {
    var th = document.createElement("th");
    th.colSpan = group.questionIds.length;
    th.textContent = group.skill;
    subskillRow.appendChild(th);
  });

  // Summary headers in sub-skill row
  var scoreTh = document.createElement("th");
  scoreTh.rowSpan = 2;
  scoreTh.textContent = "Score";
  scoreTh.className = "summary-header";
  subskillRow.appendChild(scoreTh);

  var masteryTh = document.createElement("th");
  masteryTh.rowSpan = 2;
  masteryTh.textContent = "Mastery";
  masteryTh.className = "summary-header";
  subskillRow.appendChild(masteryTh);

  thead.appendChild(subskillRow);

  // Row 2: Question numbers
  var questionRow = document.createElement("tr");
  questionRow.className = "question-row";

  questions.forEach(function (q) {
    var th = document.createElement("th");
    th.textContent = q.id;
    questionRow.appendChild(th);
  });

  thead.appendChild(questionRow);
  table.appendChild(thead);

  // ── TBODY ──
  var tbody = document.createElement("tbody");

  students.forEach(function (student) {
    // Find this student's result for the topic
    var result = null;
    student.results.forEach(function (r) {
      if (r.topic === topic) result = r;
    });

    var tr = document.createElement("tr");

    // Student name
    var nameTd = document.createElement("td");
    nameTd.className = "student-cell";
    nameTd.textContent = student.studentName;
    tr.appendChild(nameTd);

    // Build answer lookup by questionId
    var answerMap = {};
    if (result && result.answers) {
      result.answers.forEach(function (a) {
        answerMap[a.questionId] = a;
      });
    }

    // Question cells
    questions.forEach(function (q) {
      var td = document.createElement("td");
      td.className = "score-cell";

      var answer = answerMap[q.id];
      if (!result) {
        td.textContent = "-";
        td.className += " cell-empty";
      } else if (answer) {
        td.textContent = answer.correct ? "1" : "0";
        td.className += answer.correct ? " cell-correct" : " cell-incorrect";
      } else {
        td.textContent = "-";
        td.className += " cell-empty";
      }

      tr.appendChild(td);
    });

    // Score total
    var scoreTd = document.createElement("td");
    scoreTd.className = "summary-cell";
    if (result) {
      scoreTd.textContent = result.score + "/" + result.total;
    } else {
      scoreTd.textContent = "-";
    }
    tr.appendChild(scoreTd);

    // Mastery
    var masteryTd = document.createElement("td");
    masteryTd.className = "summary-cell";
    if (result) {
      masteryTd.textContent = result.mastery;
      masteryTd.className += " " + getMasteryTextClass(result.mastery);
    } else {
      masteryTd.textContent = "-";
    }
    tr.appendChild(masteryTd);

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  scrollWrapper.appendChild(table);
  return scrollWrapper;
}

// ── Empty State ──────────────────────────────────────────

function buildEmptyState() {
  var el = document.createElement("div");
  el.className = "empty-state";
  el.innerHTML =
    '<div class="empty-icon">&#128202;</div>' +
    "<p>No assessment results yet.</p>" +
    "<p>Results will appear here after students complete an assessment.</p>";
  return el;
}

// ── CSV Download ─────────────────────────────────────────

function downloadCSV() {
  var topicFilter = document.getElementById("topic-filter");
  var studentFilter = document.getElementById("student-filter");
  var topic = topicFilter ? topicFilter.value : null;
  var studentId = studentFilter ? studentFilter.value : "__all__";

  var reportData = getReportData();
  if (!topic) return;

  var questions = getQuestionsForTopic(topic);
  var skillGroups = getSkillGroups(topic);

  // Header row 1: sub-skill names
  var headerSkills = [""];
  skillGroups.forEach(function (group) {
    headerSkills.push(group.skill);
    for (var i = 1; i < group.questionIds.length; i++) {
      headerSkills.push("");
    }
  });
  headerSkills.push("Score", "Mastery");

  // Header row 2: question numbers
  var headerNums = ["Student"];
  questions.forEach(function (q) { headerNums.push("Q" + q.id); });
  headerNums.push("Score", "Mastery");

  var rows = [headerSkills, headerNums];

  reportData.forEach(function (student) {
    if (studentId !== "__all__" && student.studentId !== studentId) return;

    var result = null;
    student.results.forEach(function (r) {
      if (r.topic === topic) result = r;
    });

    var row = [student.studentName];
    var answerMap = {};
    if (result && result.answers) {
      result.answers.forEach(function (a) { answerMap[a.questionId] = a; });
    }

    questions.forEach(function (q) {
      var answer = answerMap[q.id];
      if (!result) {
        row.push("");
      } else if (answer) {
        row.push(answer.correct ? 1 : 0);
      } else {
        row.push("");
      }
    });

    row.push(result ? result.score + "/" + result.total : "");
    row.push(result ? result.mastery : "");
    rows.push(row);
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
  link.download = "assessment-report-" + topic + ".csv";
  link.click();
  URL.revokeObjectURL(url);
}

// ── Filter Setup ─────────────────────────────────────────

function populateFilters(reportData) {
  var topicSelect = document.getElementById("topic-filter");
  var studentSelect = document.getElementById("student-filter");
  if (!topicSelect || !studentSelect) return;

  // Topics
  var topics = getAvailableTopics(reportData);
  topicSelect.innerHTML = "";
  topics.forEach(function (topic) {
    var opt = document.createElement("option");
    opt.value = topic;
    opt.textContent = getTopicTitle(topic);
    topicSelect.appendChild(opt);
  });

  // Students
  studentSelect.innerHTML = '<option value="__all__">All Students</option>';
  reportData.forEach(function (student) {
    var opt = document.createElement("option");
    opt.value = student.studentId;
    opt.textContent = student.studentName;
    studentSelect.appendChild(opt);
  });

  topicSelect.addEventListener("change", renderMatrix);
  studentSelect.addEventListener("change", renderMatrix);
}

// ── Render Matrix ────────────────────────────────────────

function renderMatrix() {
  var wrapper = document.getElementById("reports-wrapper");
  wrapper.innerHTML = "";

  var reportData = getReportData();
  if (reportData.length === 0) {
    wrapper.appendChild(buildEmptyState());
    return;
  }

  var topicSelect = document.getElementById("topic-filter");
  var studentSelect = document.getElementById("student-filter");
  var topic = topicSelect ? topicSelect.value : null;
  var studentId = studentSelect ? studentSelect.value : "__all__";

  if (!topic) {
    wrapper.appendChild(buildEmptyState());
    return;
  }

  // Filter students
  var filteredStudents;
  if (studentId === "__all__") {
    filteredStudents = reportData;
  } else {
    filteredStudents = reportData.filter(function (s) {
      return s.studentId === studentId;
    });
  }

  var matrix = buildMatrix(filteredStudents, topic);
  if (matrix) {
    wrapper.appendChild(matrix);
  } else {
    wrapper.appendChild(buildEmptyState());
  }
}

// ── Main Entry Point ─────────────────────────────────────

function renderReports() {
  var reportData = getReportData();

  if (reportData.length === 0) {
    var wrapper = document.getElementById("reports-wrapper");
    wrapper.innerHTML = "";
    wrapper.appendChild(buildEmptyState());
    return;
  }

  // Show controls
  var filterBar = document.getElementById("filter-bar");
  var actionBar = document.getElementById("action-bar");
  if (filterBar) filterBar.style.display = "flex";
  if (actionBar) actionBar.style.display = "flex";

  populateFilters(reportData);
  renderMatrix();
}

window.addEventListener("DOMContentLoaded", renderReports);
