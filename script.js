const publicSpreadsheetKey = '1FpITDwLRyfHkOObMrQpmXgFhqaHJUlKfQtavLnJzFfI';

const sheetName = 'G1_OA'; // The tab/sheet name you want to load

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
      if (!data || !data[sheetName]) {
        console.error("❌ Sheet not found or data error. Tab name used:", sheetName);
        document.getElementById("question").innerText = "Error loading questions.";
        return;
      }

      questions = data[sheetName].elements
        .filter(row => row.Question && row.Answer)
        .map(row => ({
          level: parseInt(row.Level),
          skill: row.Standard,
          question: row.Question,
          choices: [row["Choice A"], row["Choice B"], row["Choice C"], row["Choice D"]],
          answer: row.Answer
        }));

      if (questions.length === 0) {
        document.getElementById("question").innerText = "⚠️ No valid questions found.";
        return;
      }

      displayQuestion();
    },
    error: function (err) {
      console.error('Tabletop error:', err);
      document.getElementById("question").innerText = "Error loading questions.";
    }
  });
}

function displayQuestion() {
  const question = questions[currentQuestionIndex];
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
  if (questionCount < questions.length) {
    currentQuestionIndex++;
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
  const assessmentContainer = document.querySelector(".assessment-container");
  assessmentContainer.innerHTML = `
    <h2>Assessment Complete!</h2>
    <p>Your score: ${score} out of ${questions.length}</p>
  `;
}

window.addEventListener('DOMContentLoaded', init);
