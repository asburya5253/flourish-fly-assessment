const validCodes = {
  "B1-JS": { id: "johnny_smith", name: "Johnny Smith" },
  "B1-MT": { id: "mary_taylor",  name: "Mary Taylor" },
  "B2-RH": { id: "ryan_hughes",  name: "Ryan Hughes" }
};

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  const input = document.getElementById("access-code");
  const errorMessage = document.getElementById("error-message");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const code = input.value.trim().toUpperCase();
    const student = validCodes[code];

    if (student) {
      localStorage.setItem("studentId", student.id);
      localStorage.setItem("studentName", student.name);

      // Register student in the roster so the dashboard knows about them
      const roster = JSON.parse(localStorage.getItem("studentRoster") || "{}");
      roster[student.id] = student.name;
      localStorage.setItem("studentRoster", JSON.stringify(roster));

      window.location.href = "assessment.html";
    } else {
      errorMessage.style.display = "block";
    }
  });
});
