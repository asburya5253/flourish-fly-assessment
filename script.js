// Flourish & Fly – Assessment Engine
// Renders computation problems from questions.js and accepts typed answers.

var currentAssessment = null;  // e.g. "addition"
var questions = [];
var currentIndex = 0;
var score = 0;
var answers = [];  // track each response for reporting

// DOM references
var assessmentTitle = document.getElementById("assessmentTitle");
var skillTitle = document.getElementById("skillTitle");
var problemArea = document.getElementById("problem-area");
var answerInput = document.getElementById("answer-input");
var feedbackMsg = document.getElementById("feedback-msg");
var submitBtn = document.getElementById("btn-submit");
var questionCount = document.getElementById("questionCount");
var progressFill = document.getElementById("progressFill");

// ── Determine which assessment to load ──────────────────────

function init() {
  // Default to "addition"; later this can be chosen from a menu or URL param
  var params = new URLSearchParams(window.location.search);
  currentAssessment = params.get("topic") || "addition";

  var bank = questionBank[currentAssessment];
  if (!bank || !bank.questions || bank.questions.length === 0) {
    assessmentTitle.textContent = "No questions found.";
    problemArea.innerHTML = "";
    return;
  }

  questions = bank.questions;
  assessmentTitle.textContent = bank.title;
  showQuestion();
}

// ── Format a number with commas ─────────────────────────────

function formatNumber(n) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// ── Render the current question ─────────────────────────────

function showQuestion() {
  if (currentIndex >= questions.length) {
    showResults();
    return;
  }

  var q = questions[currentIndex];
  var bank = questionBank[currentAssessment];
  var op = bank.operation || "+";

  skillTitle.textContent = q.skill;
  questionCount.textContent = "Question " + (currentIndex + 1) + " of " + questions.length;
  progressFill.style.width = ((currentIndex / questions.length) * 100) + "%";

  // Clear state
  answerInput.value = "";
  answerInput.className = "";
  feedbackMsg.textContent = "";
  submitBtn.disabled = false;
  submitBtn.textContent = "Submit";

  // Render problem based on type
  if (q.type === "horizontal") {
    renderHorizontal(q, op);
  } else if (q.type === "missing-addend") {
    renderMissingAddend(q, op);
  } else if (q.type === "missing-subtrahend") {
    renderMissingSubtrahend(q, op);
  } else if (q.type === "missing-minuend") {
    renderMissingMinuend(q, op);
  } else if (q.type === "vertical") {
    renderVertical(q, op);
  }

  answerInput.focus();
}

function renderHorizontal(q, op) {
  var html = '<div class="problem-horizontal">';
  html += formatNumber(q.parts[0]) + " " + op + " " + formatNumber(q.parts[1]) + " = ";
  html += '<span class="blank">&nbsp;</span>';
  html += "</div>";
  problemArea.innerHTML = html;
}

function renderMissingAddend(q, op) {
  var html = '<div class="problem-horizontal">';
  html += formatNumber(q.left) + " " + op + " <span class=\"blank\">&nbsp;</span> = " + formatNumber(q.sum);
  html += "</div>";
  problemArea.innerHTML = html;
}

function renderMissingSubtrahend(q, op) {
  var html = '<div class="problem-horizontal">';
  html += formatNumber(q.left) + " " + op + " <span class=\"blank\">&nbsp;</span> = " + formatNumber(q.difference);
  html += "</div>";
  problemArea.innerHTML = html;
}

function renderMissingMinuend(q, op) {
  var html = '<div class="problem-horizontal">';
  html += "<span class=\"blank\">&nbsp;</span> " + op + " " + formatNumber(q.right) + " = " + formatNumber(q.difference);
  html += "</div>";
  problemArea.innerHTML = html;
}

function renderVertical(q, op) {
  var topStr = formatNumber(q.top);
  var botStr = formatNumber(q.bottom);

  var html = '<div class="problem-vertical">';
  html += '<span class="num-row">' + topStr + "</span>";
  html += '<span class="op-row"><span class="op-sign">' + op + "</span>" + botStr + "</span>";
  html += '<hr class="divider" />';
  html += "</div>";
  problemArea.innerHTML = html;
}

// ── Handle answer submission ────────────────────────────────

function handleSubmit() {
  if (submitBtn.disabled) return;

  var q = questions[currentIndex];
  var raw = answerInput.value.trim().replace(/,/g, "");
  var entered = parseInt(raw, 10);

  if (raw === "" || isNaN(entered)) {
    feedbackMsg.textContent = "Please enter a number.";
    feedbackMsg.style.color = "#e74c3c";
    return;
  }

  submitBtn.disabled = true;
  var isCorrect = (entered === q.answer);

  answers.push({
    questionId: q.id,
    skill: q.skill,
    correct: isCorrect,
    entered: entered,
    expected: q.answer
  });

  if (isCorrect) {
    score++;
    answerInput.className = "correct";
    feedbackMsg.style.color = "#4CAF50";
    feedbackMsg.textContent = "Correct!";
  } else {
    answerInput.className = "incorrect";
    feedbackMsg.style.color = "#e74c3c";
    feedbackMsg.textContent = "The answer is " + formatNumber(q.answer);
  }

  setTimeout(function () {
    currentIndex++;
    showQuestion();
  }, 1200);
}

submitBtn.addEventListener("click", handleSubmit);

answerInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    e.preventDefault();
    handleSubmit();
  }
});

// ── Results screen ──────────────────────────────────────────

function getMasteryLevel(score, bank) {
  var thresholds = bank.mastery || { mastered: 8, review: 6 };
  if (score >= thresholds.mastered) return { label: "Mastered", color: "#4CAF50", bg: "#e8f5e9" };
  if (score >= thresholds.review)   return { label: "Needs Review", color: "#ff9800", bg: "#fff3e0" };
  return { label: "Full Reteach", color: "#e74c3c", bg: "#fdecea" };
}

function buildSkillBreakdown() {
  // Group answers by skill and show correct/incorrect per sub-skill
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

  var html = '<table style="width:100%; border-collapse:collapse; margin-top:16px; text-align:left;">';
  html += '<thead><tr style="border-bottom:2px solid #9370db;">';
  html += '<th style="padding:8px; color:#4b0082;">Sub-Skill</th>';
  html += '<th style="padding:8px; text-align:center; color:#4b0082;">Result</th>';
  html += '</tr></thead><tbody>';

  skills.forEach(function (s) {
    var allCorrect = (s.correct === s.total);
    var icon = allCorrect ? "&#10003;" : "&#10007;";
    var color = allCorrect ? "#4CAF50" : "#e74c3c";
    html += "<tr style='border-bottom:1px solid #ddd;'>";
    html += "<td style='padding:8px;'>" + s.skill + "</td>";
    html += "<td style='padding:8px; text-align:center; font-weight:700; color:" + color + ";'>" + s.correct + "/" + s.total + " " + icon + "</td>";
    html += "</tr>";
  });

  html += "</tbody></table>";
  return html;
}

function showResults() {
  var pct = Math.round((score / questions.length) * 100);
  var bank = questionBank[currentAssessment];
  var mastery = getMasteryLevel(score, bank);

  // Save results to localStorage
  var studentId = localStorage.getItem("studentId") || "unknown";
  var result = {
    studentId: studentId,
    topic: currentAssessment,
    score: score,
    total: questions.length,
    percent: pct,
    mastery: mastery.label,
    answers: answers,
    date: new Date().toISOString()
  };

  var allResults = JSON.parse(localStorage.getItem("assessmentResults") || "[]");
  allResults.push(result);
  localStorage.setItem("assessmentResults", JSON.stringify(allResults));

  // Update progress bar to 100%
  progressFill.style.width = "100%";

  var container = document.querySelector(".assessment-container");
  container.innerHTML =
    "<h2>Assessment Complete!</h2>" +
    '<p class="score-display">You scored <strong>' + score + "</strong> out of <strong>" + questions.length + "</strong></p>" +
    '<div style="display:inline-block; padding:10px 24px; border-radius:8px; font-size:1.2rem; font-weight:700; color:' + mastery.color + '; background:' + mastery.bg + '; border:2px solid ' + mastery.color + '; margin:12px 0;">' + mastery.label + "</div>" +
    '<div class="progress-bar" style="margin-top:16px;"><div style="height:100%; width:' + pct + "%; background-color:" + mastery.color + '; border-radius:6px;"></div></div>' +
    '<div style="text-align:left; margin-top:20px;">' +
    '<h3 style="color:#4b0082; margin-bottom:4px;">Sub-Skill Breakdown</h3>' +
    buildSkillBreakdown() +
    "</div>" +
    '<button onclick="location.href=\'student-login.html\'" style="margin-top:24px;">Back to Login</button>';
}

// ── Start ───────────────────────────────────────────────────
init();
