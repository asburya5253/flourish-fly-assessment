const domainNames = {
  OA: "Operations & Algebraic Thinking",
  NBT: "Number & Base Ten",
  MD: "Measurement & Data",
  G: "Geometry"
};

const gradeLabels = {
  "K": "Kindergarten", "1": "1st Grade", "2": "2nd Grade",
  "3": "3rd Grade", "4": "4th Grade", "5": "5th Grade"
};

const domains = ["OA", "NBT", "MD", "G"];

function parseSheet(sheet) {
  const match = sheet.match(/^G([K0-5])_(\w+)$/);
  if (!match) return null;
  return { grade: match[1], domain: match[2] };
}

function masteryColor(pct) {
  if (pct >= 70) return "#4CAF50";
  if (pct >= 50) return "#ff9800";
  return "#e74c3c";
}

function getStudentGradeData(studentId, grade) {
  const results = JSON.parse(localStorage.getItem("assessmentResults") || "[]");
  const data = {};

  results
    .filter(r => r.studentId === studentId)
    .forEach(r => {
      const parsed = parseSheet(r.sheet);
      if (!parsed || parsed.grade !== grade) return;
      data[parsed.domain] = r.percent;
    });

  return data;
}

function renderGradeReport() {
  const params = new URLSearchParams(window.location.search);
  const studentName = params.get("student") || "Student";
  const studentId = params.get("id") || localStorage.getItem("studentId") || "unknown";
  const grade = params.get("grade") || "K";

  const gradeLabel = gradeLabels[grade] || "Grade " + grade;
  document.getElementById("page-title").textContent = `${studentName} — ${gradeLabel}`;

  const gradeData = getStudentGradeData(studentId, grade);
  const tbody = document.getElementById("report-body");
  tbody.innerHTML = "";

  domains.forEach(domain => {
    const pct = gradeData[domain];
    const tr = document.createElement("tr");

    const domainTd = document.createElement("td");
    domainTd.textContent = domainNames[domain];
    domainTd.style.fontWeight = "600";
    domainTd.style.textAlign = "left";
    tr.appendChild(domainTd);

    const masteryTd = document.createElement("td");
    if (pct !== undefined) {
      masteryTd.innerHTML = `
        <strong>${pct}%</strong>
        <div class="mastery-bar">
          <div class="mastery-fill" style="width: ${pct}%; background-color: ${masteryColor(pct)};"></div>
        </div>
      `;
    } else {
      masteryTd.textContent = "Not assessed";
      masteryTd.style.color = "#999";
    }
    tr.appendChild(masteryTd);

    tbody.appendChild(tr);
  });
}

window.addEventListener("DOMContentLoaded", renderGradeReport);
