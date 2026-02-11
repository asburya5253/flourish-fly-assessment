// Domain full names for display
const domainNames = {
  OA: "Operations & Algebraic Thinking",
  NBT: "Number & Base Ten",
  MD: "Measurement & Data",
  G: "Geometry"
};

// Mock skill-level data per domain, broken down by grade
const domainSkills = {
  OA: [
    { skill: "Addition",       scores: { "K": 95, "1": 90, "2": 80, "3": 65, "4": 55, "5": 45 } },
    { skill: "Subtraction",    scores: { "K": 90, "1": 85, "2": 75, "3": 60, "4": 50, "5": 40 } },
    { skill: "Word Problems",  scores: { "K": 85, "1": 80, "2": 70, "3": 55, "4": 45, "5": 35 } }
  ],
  NBT: [
    { skill: "Place Value",    scores: { "K": 95, "1": 92, "2": 88, "3": 82, "4": 72, "5": 68 } },
    { skill: "Comparing Numbers", scores: { "K": 95, "1": 90, "2": 85, "3": 80, "4": 70, "5": 65 } },
    { skill: "Rounding",       scores: { "K": 93, "1": 88, "2": 82, "3": 78, "4": 68, "5": 62 } }
  ],
  MD: [
    { skill: "Telling Time",   scores: { "K": 75, "1": 65, "2": 60, "3": 55, "4": 50, "5": 45 } },
    { skill: "Measuring Length", scores: { "K": 70, "1": 60, "2": 55, "3": 50, "4": 45, "5": 40 } },
    { skill: "Data & Graphs",  scores: { "K": 65, "1": 55, "2": 50, "3": 45, "4": 40, "5": 35 } }
  ],
  G: [
    { skill: "Shape Recognition", scores: { "K": 70, "1": 65, "2": 60, "3": 55, "4": 50, "5": 45 } },
    { skill: "Symmetry",       scores: { "K": 65, "1": 60, "2": 55, "3": 50, "4": 45, "5": 40 } },
    { skill: "Spatial Reasoning", scores: { "K": 60, "1": 55, "2": 50, "3": 45, "4": 40, "5": 35 } }
  ]
};

const grades = ["K", "1", "2", "3", "4", "5"];

function renderDomainReport() {
  const params = new URLSearchParams(window.location.search);
  const studentName = params.get("student") || "Student";
  const domain = params.get("domain") || "OA";

  const fullName = domainNames[domain] || domain;
  document.getElementById("page-title").textContent = `${studentName} — ${fullName}`;

  const skills = domainSkills[domain] || [];
  const tbody = document.getElementById("report-body");
  tbody.innerHTML = "";

  skills.forEach(item => {
    const tr = document.createElement("tr");

    const skillTd = document.createElement("td");
    skillTd.textContent = item.skill;
    skillTd.style.fontWeight = "600";
    tr.appendChild(skillTd);

    grades.forEach(grade => {
      const td = document.createElement("td");
      const val = item.scores[grade];
      td.textContent = val + "%";
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
}

window.addEventListener("DOMContentLoaded", renderDomainReport);
