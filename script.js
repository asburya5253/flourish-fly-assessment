const spreadsheetId = "1dA_WEldvo9bBA2IQ6H9N4fSSZZCMBpAu";
const sheetName = "G1_OA";
const range = `${sheetName}!A2:H`;
const apiKey = "AIzaSyBI2rGFfbo18U2UIkFT6NlDTVTP-7xODOc";

// Column mapping — adjust these indices if your sheet layout differs
// Expected: [0] ID, [1] Question, [2] Choice A, [3] Choice B, [4] Choice C, [5] Choice D, [6] Correct Answer, [7] Skill
const COL = { ID: 0, QUESTION: 1, A: 2, B: 3, C: 4, D: 5, ANSWER: 6, SKILL: 7 };

let questions = [];
let currentIndex = 0;
let score = 0;

// DOM elements
const skillTitle = document.getElementById("skillTitle");
const questionEl = document.getElementById("question");
const choicesEl = document.getElementById("choices");
const questionCount = document.getElementById("questionCount");
const progressFill = document.getElementById("progressFill");

function init() {
  fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      if (!data.values || data.values.length === 0) {
        questionEl.textContent = "No questions found.";
        return;
      }

      questions = data.values.map(row => ({
        question: row[COL.QUESTION] || "",
        choices: [
          row[COL.A] || "",
          row[COL.B] || "",
          row[COL.C] || "",
          row[COL.D] || ""
        ].filter(c => c !== ""),
        answer: row[COL.ANSWER] || "",
        skill: row[COL.SKILL] || sheetName
      }));

      showQuestion();
    })
    .catch(error => {
      console.error("Google Sheets API Error:", error);
      questionEl.textContent = "Failed to load questions. Please try again later.";
    });
}

function showQuestion() {
  if (currentIndex >= questions.length) {
    showResults();
    return;
  }

  const q = questions[currentIndex];

  skillTitle.textContent = "Skill: " + q.skill;
  questionEl.textContent = q.question;
  questionCount.textContent = `Question ${currentIndex + 1} of ${questions.length}`;
  progressFill.style.width = ((currentIndex / questions.length) * 100) + "%";

  choicesEl.innerHTML = "";
  q.choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.textContent = choice;
    btn.addEventListener("click", () => handleAnswer(btn, choice, q));
    choicesEl.appendChild(btn);
  });
}

function handleAnswer(selectedBtn, choice, q) {
  // Disable all buttons to prevent double-clicks
  const buttons = choicesEl.querySelectorAll("button");
  buttons.forEach(btn => {
    btn.disabled = true;
    btn.style.cursor = "default";
  });

  // Check if the selected answer matches the correct answer
  const isCorrect = choice.trim() === q.answer.trim();

  if (isCorrect) {
    selectedBtn.style.backgroundColor = "#4CAF50"; // green
    score++;
  } else {
    selectedBtn.style.backgroundColor = "#e74c3c"; // red
    // Highlight the correct answer in green
    buttons.forEach(btn => {
      if (btn.textContent.trim() === q.answer.trim()) {
        btn.style.backgroundColor = "#4CAF50";
      }
    });
  }

  // Move to next question after a short delay
  setTimeout(() => {
    currentIndex++;
    showQuestion();
  }, 1000);
}

function showResults() {
  const pct = Math.round((score / questions.length) * 100);

  // Save results to localStorage
  const studentId = localStorage.getItem("studentId") || "unknown";
  const result = {
    studentId: studentId,
    sheet: sheetName,
    score: score,
    total: questions.length,
    percent: pct,
    date: new Date().toISOString()
  };

  const allResults = JSON.parse(localStorage.getItem("assessmentResults") || "[]");
  allResults.push(result);
  localStorage.setItem("assessmentResults", JSON.stringify(allResults));

  // Show completion screen
  document.querySelector(".assessment-container").innerHTML = `
    <h2>Assessment Complete!</h2>
    <p class="score-display">You scored <strong>${score}</strong> out of <strong>${questions.length}</strong> (${pct}%)</p>
    <div class="progress-bar">
      <div class="progress-fill" style="width: ${pct}%; background-color: ${pct >= 70 ? '#4CAF50' : pct >= 50 ? '#ff9800' : '#e74c3c'};"></div>
    </div>
    <p style="margin-top: 20px; color: #555;">${
      pct >= 70 ? "Great job!" : pct >= 50 ? "Keep practicing!" : "Let's review this skill together."
    }</p>
    <button onclick="location.href='index.html'" style="margin-top: 20px;">Back to Home</button>
  `;
}

init();
