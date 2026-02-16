document.addEventListener("DOMContentLoaded", function () {
  var form = document.getElementById("login-form");
  var input = document.getElementById("access-code");
  var errorMessage = document.getElementById("error-message");

  var modal = document.getElementById("confirm-modal");
  var modalName = document.getElementById("modal-name");
  var modalGrade = document.getElementById("modal-grade");
  var passcodeInput = document.getElementById("passcode-input");
  var passcodeError = document.getElementById("passcode-error");
  var btnConfirm = document.getElementById("btn-confirm");
  var btnNotMe = document.getElementById("btn-not-me");

  var gradeLabels = {
    "K": "Kindergarten", "1": "1st Grade", "2": "2nd Grade",
    "3": "3rd Grade", "4": "4th Grade", "5": "5th Grade",
    "6": "6th Grade", "7": "7th Grade", "8": "8th Grade",
    "9": "9th Grade", "10": "10th Grade", "11": "11th Grade",
    "12": "12th Grade"
  };

  var pendingStudent = null;

  // Step 1: Enter login ID
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    errorMessage.style.display = "none";

    var code = input.value.trim().toLowerCase();
    var roster = JSON.parse(localStorage.getItem("classRoster") || "[]");

    var student = null;
    for (var i = 0; i < roster.length; i++) {
      if (roster[i].loginId && roster[i].loginId.toLowerCase() === code) {
        student = roster[i];
        break;
      }
    }

    if (!student) {
      errorMessage.style.display = "block";
      return;
    }

    // Show confirmation modal
    pendingStudent = student;
    modalName.textContent = student.firstName + " " + student.lastName;
    modalGrade.textContent = student.gradeLevel
      ? (gradeLabels[student.gradeLevel] || student.gradeLevel)
      : "Not set";
    passcodeInput.value = "";
    passcodeError.textContent = "";
    modal.classList.add("active");
    passcodeInput.focus();
  });

  // Step 2: Confirm identity with birthday passcode
  btnConfirm.addEventListener("click", function () {
    if (!pendingStudent) return;

    var entered = passcodeInput.value.trim();

    // Convert the stored birthday (MM/DD) to a 4-digit code (MMDD)
    var storedBday = (pendingStudent.birthday || "").replace(/\D/g, "");

    if (!storedBday) {
      // No birthday on file — skip passcode check
      completeLogin(pendingStudent);
      return;
    }

    if (entered === storedBday) {
      completeLogin(pendingStudent);
    } else {
      passcodeError.textContent = "Incorrect birthday code. Try again.";
    }
  });

  // Allow pressing Enter in passcode field to confirm
  passcodeInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      btnConfirm.click();
    }
  });

  // "That's not me" — close modal, go back to ID entry
  btnNotMe.addEventListener("click", function () {
    pendingStudent = null;
    modal.classList.remove("active");
    input.value = "";
    input.focus();
  });

  function completeLogin(student) {
    var studentId = student.loginId;
    var studentName = student.firstName + " " + student.lastName;

    localStorage.setItem("studentId", studentId);
    localStorage.setItem("studentName", studentName);

    var rosterMap = JSON.parse(localStorage.getItem("studentRoster") || "{}");
    rosterMap[studentId] = studentName;
    localStorage.setItem("studentRoster", JSON.stringify(rosterMap));

    modal.classList.remove("active");
    showTopicPicker();
  }

  function showTopicPicker() {
    var topicModal = document.getElementById("topic-modal");
    var container = document.getElementById("topic-choices");
    container.innerHTML = "";

    if (typeof questionBank === "undefined") {
      window.location.href = "assessment.html";
      return;
    }

    var topics = Object.keys(questionBank);
    if (topics.length === 1) {
      window.location.href = "assessment.html?topic=" + topics[0];
      return;
    }

    topics.forEach(function (topic) {
      var bank = questionBank[topic];
      var btn = document.createElement("button");
      btn.className = "btn-confirm";
      btn.style.padding = "14px 24px";
      btn.style.fontSize = "1.05rem";
      btn.style.width = "100%";
      btn.textContent = bank.title;
      btn.addEventListener("click", function () {
        window.location.href = "assessment.html?topic=" + topic;
      });
      container.appendChild(btn);
    });

    topicModal.classList.add("active");
  }
});
