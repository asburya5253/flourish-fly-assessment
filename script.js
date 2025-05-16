const spreadsheetId = "1dA_WEldvo9bBA2IQ6H9N4fSSZZCMBpAu";
const apiKey = "AIzaSyBykPFEhJCF49uKgkAQq3R2Znz61dgleYw";
const sheetName = "G1_OA"; // must match your tab name exactly
const range = `${sheetName}!A2:H`; // skip header row

let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let questionCount = 0;

function init() {
  fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`)
    .then((response) => response.json())
    .then((data) => {
      if (!data.values || data.values.length === 0) {
        document.getElementById("question").innerText = "❌ No data found.";
        return;
      }

      questions = data.values
        .filter(row => row[2] && row[7]) // Question and Answer must exist
        .map(row => ({
          level: parseInt(row[0]), // Level
          skill: row[1],           // Standard
          question: row[2],        // Question
          choices: [row[3], row[4], row[5], row[6]], // A, B, C, D
          answer: row[7]           // Answer
        }));

      displayQuestion();
    })
    .catch((error) => {
      console.error("Google Sheets API Error:", error);
      document.getElementById("question").innerText = "❌ Failed to load questions.";
    });
}

function displayQuestion() {
  const question = questions[currentQuestionIndex];
  if (!question) return;

  document.getElementById("skillTitle").innerText = `Skill: ${question.skill}`;
  document.getElementById("question").innerText = question.question;

  const choicesContainer = document.getElementById("choices");
  choicesContainer.innerHTML = "";

  question.choices.forEach(choice => {
    const button = document.createElement("button");
    button.textContent = choice;
    button.onclick = () => handleAnswer(choice);
    choicesContainer.appendChild(button);
  });

  document.getElementById("questionCount").innerText = `Question ${questionCount + 1} of ${questions.length}`;
  updateProgressBar();
}

function handleAnswer(choice) {
  const question = questions[currentQuestionIndex];
  if (choice === question.answer) {
    score++;
  }

  questionCount++;
  currentQuestionIndex++;

  if (currentQuestionIndex < questions.length) {
    displayQuestion();
  } else {
    showResults();
  }
}

function updateProgressBar() {
  const progress = (questionCount / questions.length) * 100;
  document.getElementById("progressFill").style.width = `${progress}%`;
}

function showResults() {
  document.querySelector(".assessment-container").innerHTML = `
    <h2>Assessment Complete!</h2>
    <p>Your score: ${score} out of ${questions.length}</p>
  `;
}

window.addEventListener("DOMContentLoaded", init);
