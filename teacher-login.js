const form = document.getElementById("teacher-login-form");
const errorMessage = document.getElementById("login-error");

form.addEventListener("submit", function (e) {
  e.preventDefault();
  errorMessage.classList.add("hidden");

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  const teachers = JSON.parse(localStorage.getItem("teachers") || "[]");
  const match = teachers.find(t => t.email === email && t.password === password);

  if (match) {
    localStorage.setItem("teacherEmail", email);
    window.location.href = "teacher-dashboard.html";
  } else {
    errorMessage.textContent = "Invalid credentials. Try again.";
    errorMessage.classList.remove("hidden");
  }
});
