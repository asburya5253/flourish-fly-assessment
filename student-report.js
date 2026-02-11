const domains = ["OA", "NBT", "MD", "G"];
const grades = ["K", "1", "2", "3", "4", "5"];

// Parse sheet name like "G1_OA" into { grade: "1", domain: "OA" }
function parseSheet(sheet) {
  const match = sheet.match(/^G([K0-5])_(\w+)$/);
  if (!match) return null;
  return { grade: match[1], domain: match[2] };
}

// Build mastery object from localStorage results for a given student
function getStudentMastery(studentId) {
  const results = JSON.parse(localStorage.getItem("assessmentResults") || "[]");
  const roster = JSON.parse(localStorage.getItem("studentRoster") || "{}");
  const name = roster[studentId] || studentId.replace(/_/g, " ");

  const mastery = {};
  domains.forEach(d => {
    mastery[d] = {};
    grades.forEach(g => { mastery[d][g] = null; });
  });

  results
    .filter(r => r.studentId === studentId)
    .forEach(r => {
      const parsed = parseSheet(r.sheet);
      if (!parsed) return;
      if (mastery[parsed.domain]) {
        mastery[parsed.domain][parsed.grade] = r.percent;
      }
    });

  return { name, mastery };
}

function renderReport() {
  const params = new URLSearchParams(window.location.search);
  const studentId = params.get("id") || localStorage.getItem("studentId") || "unknown";
  const student = getStudentMastery(studentId);

  document.getElementById("student-name").textContent = student.name;

  const tbody = document.getElementById("report-body");
  tbody.innerHTML = "";

  domains.forEach(domain => {
    const tr = document.createElement("tr");

    // Domain name clickable cell
    const domainTd = document.createElement("td");
    domainTd.textContent = domain;
    domainTd.classList.add("clickable");
    domainTd.onclick = () => {
      window.location.href = `domain-report.html?student=${encodeURIComponent(student.name)}&domain=${domain}`;
    };
    tr.appendChild(domainTd);

    // Mastery % per grade
    grades.forEach(grade => {
      const td = document.createElement("td");
      const val = student.mastery[domain][grade];
      td.textContent = val !== null ? val + "%" : "—";
      td.classList.add("clickable");
      td.onclick = () => {
        window.location.href = `grade-report.html?student=${encodeURIComponent(student.name)}&id=${encodeURIComponent(studentId)}&grade=${grade}`;
      };
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  // Make grade headers clickable
  const headers = document.querySelectorAll("thead th");
  grades.forEach((grade, idx) => {
    headers[idx + 1].classList.add("clickable");
    headers[idx + 1].onclick = () => {
      window.location.href = `grade-report.html?student=${encodeURIComponent(student.name)}&id=${encodeURIComponent(studentId)}&grade=${grade}`;
    };
  });
}

window.addEventListener("DOMContentLoaded", renderReport);
