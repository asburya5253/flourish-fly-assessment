// Flourish & Fly – Assessment Reports
// Renders student assessment results from localStorage into card-based reports.

// ── Helpers ──────────────────────────────────────────────

function getTopicTitle(topic) {
  if (typeof questionBank !== "undefined" && questionBank[topic] && questionBank[topic].title) {
    return questionBank[topic].title;
  }
  return topic.charAt(0).toUpperCase() + topic.slice(1);
}

function getMasteryClass(mastery) {
  switch (mastery) {
    case "Mastered":     return "mastery-mastered";
    case "Needs Review": return "mastery-review";
    case "Full Reteach": return "mastery-reteach";
    default:             return "mastery-reteach";
  }
}

function getMasteryColor(mastery) {
  switch (mastery) {
    case "Mastered":     return "#4CAF50";
    case "Needs Review": return "#ff9800";
    case "Full Reteach": return "#e74c3c";
    default:             return "#e74c3c";
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

    // Sort results by date descending
    topicResults.sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    });

    reportData.push({
      studentId: studentId,
      studentName: studentName,
      results: topicResults
    });
  });

  // Sort students alphabetically
  reportData.sort(function (a, b) {
    return a.studentName.localeCompare(b.studentName);
  });

  return reportData;
}

// ── Sub-skill Grouping ───────────────────────────────────

function groupBySkill(answers) {
  var skills = [];
  var seen = {};

  answers.forEach(function (a) {
    if (!seen[a.skill]) {
      seen[a.skill] = { skill: a.skill, correct: 0, total: 0 };
      skills.push(seen[a.skill]);
    }
    seen[a.skill].total++;
    if (a.correct) seen[a.skill].correct++;
  });

  return skills;
}

// ── Card Builder ─────────────────────────────────────────

function buildStudentCard(studentName, result) {
  var card = document.createElement("div");
  card.className = "student-card";

  // Header: student name + topic
  var header = document.createElement("div");
  header.className = "student-card-header";

  var nameEl = document.createElement("span");
  nameEl.className = "student-name";
  nameEl.textContent = studentName;
  header.appendChild(nameEl);

  var topicEl = document.createElement("span");
  topicEl.className = "topic-name";
  topicEl.textContent = getTopicTitle(result.topic);
  header.appendChild(topicEl);

  card.appendChild(header);

  // Score row: "8 / 10" + mastery badge
  var scoreRow = document.createElement("div");
  scoreRow.className = "score-info";

  var scoreText = document.createElement("span");
  scoreText.className = "score-text";
  scoreText.textContent = result.score + " / " + result.total;
  scoreRow.appendChild(scoreText);

  var badge = document.createElement("span");
  badge.className = "mastery-badge " + getMasteryClass(result.mastery);
  badge.textContent = result.mastery;
  scoreRow.appendChild(badge);

  card.appendChild(scoreRow);

  // Progress bar
  var barContainer = document.createElement("div");
  barContainer.className = "percent-bar";

  var barFill = document.createElement("div");
  barFill.className = "percent-fill";
  barFill.style.width = result.percent + "%";
  barFill.style.backgroundColor = getMasteryColor(result.mastery);
  barContainer.appendChild(barFill);

  card.appendChild(barContainer);

  // Sub-skill breakdown table
  if (result.answers && result.answers.length > 0) {
    var skills = groupBySkill(result.answers);

    var table = document.createElement("table");
    table.className = "skill-table";

    var thead = document.createElement("thead");
    thead.innerHTML = "<tr><th>Sub-Skill</th><th>Result</th></tr>";
    table.appendChild(thead);

    var tbody = document.createElement("tbody");

    skills.forEach(function (s) {
      var tr = document.createElement("tr");

      var skillTd = document.createElement("td");
      skillTd.textContent = s.skill;
      tr.appendChild(skillTd);

      var resultTd = document.createElement("td");
      var allCorrect = (s.correct === s.total);
      var icon = allCorrect ? "\u2713" : "\u2717";
      var color = allCorrect ? "#4CAF50" : "#e74c3c";
      resultTd.style.fontWeight = "700";
      resultTd.style.color = color;
      resultTd.textContent = s.correct + "/" + s.total + " " + icon;
      tr.appendChild(resultTd);

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    card.appendChild(table);
  }

  return card;
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

// ── Main Render ──────────────────────────────────────────

function renderReports() {
  var wrapper = document.getElementById("reports-wrapper");
  wrapper.innerHTML = "";

  var reportData = getReportData();

  if (reportData.length === 0) {
    wrapper.appendChild(buildEmptyState());
    return;
  }

  reportData.forEach(function (student) {
    student.results.forEach(function (result) {
      var card = buildStudentCard(student.studentName, result);
      wrapper.appendChild(card);
    });
  });
}

window.addEventListener("DOMContentLoaded", renderReports);
