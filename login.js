document.addEventListener("DOMContentLoaded", function () {
  var form = document.getElementById("login-form");
  var input = document.getElementById("access-code");
  var errorMessage = document.getElementById("error-message");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var code = input.value.trim().toLowerCase();
    var roster = JSON.parse(localStorage.getItem("classRoster") || "[]");

    // Find the student whose loginId matches the entered code
    var student = null;
    for (var i = 0; i < roster.length; i++) {
      if (roster[i].loginId && roster[i].loginId.toLowerCase() === code) {
        student = roster[i];
        break;
      }
    }

    if (student) {
      var studentId = student.loginId;
      var studentName = student.firstName + " " + student.lastName;

      localStorage.setItem("studentId", studentId);
      localStorage.setItem("studentName", studentName);

      // Keep studentRoster map in sync for dashboard/reports
      var rosterMap = JSON.parse(localStorage.getItem("studentRoster") || "{}");
      rosterMap[studentId] = studentName;
      localStorage.setItem("studentRoster", JSON.stringify(rosterMap));

      window.location.href = "assessment.html";
    } else {
      errorMessage.style.display = "block";
    }
  });
});
