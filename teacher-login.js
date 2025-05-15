// Simulated teacher database
const teachers = {
    "demo@school.com": "password123"
  };
  
  const form = document.getElementById("teacher-login-form");
  const errorMessage = document.getElementById("login-error");
  
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    errorMessage.classList.add("hidden"); // Hide error on each submit
  
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
  
    if (teachers[email] === password) {
      localStorage.setItem("teacherEmail", email);
      window.location.href = "teacher-dashboard.html";
    } else {
      errorMessage.textContent = "Invalid credentials. Try again.";
      errorMessage.classList.remove("hidden");
    }
  });
  
  function signUp() {
    errorMessage.classList.add("hidden"); // Hide error on signup
  
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
  
    if (teachers[email]) {
      errorMessage.textContent = "Email already exists.";
      errorMessage.classList.remove("hidden");
    } else {
      teachers[email] = password;
      localStorage.setItem("teacherEmail", email);
      window.location.href = "teacher-dashboard.html";
    }
  }
  