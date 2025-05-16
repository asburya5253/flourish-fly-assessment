const publicSpreadsheetKey = "1dA_WEldvo9bBA2IQ6H9N4fSSZZCMBpAu";
const sheetName = "G1_OA"; // Update this if you use a different tab name

let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let questionCount = 0;

function init() {
  Tabletop.init({
    key: publicSpreadsheetKey,
    simpleSheet: false,
    wanted: [sheetName],
    callback: function (data) {
      const sheetData = data[sheetName]?.elements;
      if (!sheetData || sheetData.length === 0) {
        document.getElementById("question").innerText = "❌ No data found or sheet is empty.";
        return;
      }

      questions = sheetData
        .filter(row => row.Question && row.Answer)
        .map(row => ({
          level: parseInt(row.Level),
          skill: row.Standard,
          question: row.Question,
          choices: [row["Choice A"], row["Choice B"], row["Choice C"], row["Choice D"]],
          answer: row.Answer
        }));

      displayQuestion();
    },
    error: function (err) {
      console.error("Tabletop Error:", err);
      document.getElementById("question").innerText = "❌ Failed to load questions.";
    }
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
