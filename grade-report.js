// Same mock data as student-report.js — single source of truth when backend is added
const studentMastery = {
  name: "Suzzy",
  mastery: {
    OA:  { "K": 90, "1": 85, "2": 75, "3": 60, "4": 50, "5": 40 },
    NBT: { "K": 95, "1": 90, "2": 85, "3": 80, "4": 70, "5": 65 },
    MD:  { "K": 70, "1": 60, "2": 55, "3": 50, "4": 45, "5": 40 },
    G:   { "K": 65, "1": 60, "2": 55, "3": 50, "4": 45, "5": 40 }
  }
};

const domainNames = {
  OA: "Operations & Algebraic Thinking",
  NBT: "Number & Base Ten",
  MD: "Measurement & Data",
  G: "Geometry"
};

const gradeLabels = {
  "K": "Kindergarten",
  "1": "1st Grade",
  "2": "2nd Grade",
  "3": "3rd Grade",
  "4": "4th Grade",
  "5": "5th Grade"
};

const domains = ["OA", "NBT", "MD", "G"];

function masteryColor(pct) {
  if (pct >= 70) return "#4CAF50";
  if (pct >= 50) return "#ff9800";
  return "#e74c3c";
}

function renderGradeReport() {
  const params = new URLSearchParams(window.location.search);
  const studentName = params.get("student") || studentMastery.name;
  const grade = params.get("grade") || "K";

  const gradeLabel = gradeLabels[grade] || "Grade " + grade;
  document.getElementById("page-title").textContent = `${studentName} — ${gradeLabel}`;

  const tbody = document.getElementById("report-body");
  tbody.innerHTML = "";

  domains.forEach(domain => {
    const pct = studentMastery.mastery[domain][grade] || 0;

    const tr = document.createElement("tr");

    const domainTd = document.createElement("td");
    domainTd.textContent = domainNames[domain];
    domainTd.style.fontWeight = "600";
    domainTd.style.textAlign = "left";
    tr.appendChild(domainTd);

    const masteryTd = document.createElement("td");
    masteryTd.innerHTML = `
      <strong>${pct}%</strong>
      <div class="mastery-bar">
        <div class="mastery-fill" style="width: ${pct}%; background-color: ${masteryColor(pct)};"></div>
      </div>
    `;
    tr.appendChild(masteryTd);

    tbody.appendChild(tr);
  });
}

window.addEventListener("DOMContentLoaded", renderGradeReport);
