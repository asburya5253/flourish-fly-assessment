const validCodes = {
    "B1-JS": "johnny_smith",
    "B1-MT": "mary_taylor",
    "B2-RH": "ryan_hughes"
  };
  
  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("login-form");
    const input = document.getElementById("access-code");
    const errorMessage = document.getElementById("error-message");
  
    form.addEventListener("submit", (e) => {
      e.preventDefault();
  
      const code = input.value.trim().toUpperCase();
      console.log("Entered Code:", code);
  
      if (validCodes[code]) {
        localStorage.setItem("studentId", validCodes[code]);
        console.log("Login successful for:", validCodes[code]);
        window.location.href = "assessment.html"; // Make sure this file exists!
      } else {
        errorMessage.style.display = "block";
      }
    });
  });
  