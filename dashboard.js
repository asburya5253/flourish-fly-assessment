// Grade labels for display
const gradeLabels = {
  "K": "Kindergarten", "1": "1st Grade", "2": "2nd Grade",
  "3": "3rd Grade", "4": "4th Grade", "5": "5th Grade"
};

// Parse sheet name like "G1_OA" into { grade: "1", domain: "OA" }
function parseSheet(sheet) {
  const match = sheet.match(/^G([K0-5])_(\w+)$/);
  if (!match) return null;
  return { grade: match[1], domain: match[2] };
}

// Build student data from localStorage assessment results
function getStudentData() {
  const results = JSON.parse(localStorage.getItem("assessmentResults") || "[]");
  const roster = JSON.parse(localStorage.getItem("studentRoster") || "{}");

  // Group results by student → domain → grade, keeping the latest score
  const studentMap = {};

  results.forEach(r => {
    const parsed = parseSheet(r.sheet);
    if (!parsed) return;

    if (!studentMap[r.studentId]) {
      studentMap[r.studentId] = { scores: {} };
    }
    const s = studentMap[r.studentId];

    if (!s.scores[parsed.domain]) {
      s.scores[parsed.domain] = {};
    }
    // Keep the most recent score per grade/domain
    s.scores[parsed.domain][parsed.grade] = r.percent;
  });

  // Convert to array for the table
  const students = [];
  const domains = ["OA", "NBT", "MD", "G"];

  Object.keys(studentMap).forEach(id => {
    const name = roster[id] || id.replace(/_/g, " ");
    const mastery = {};

    domains.forEach(domain => {
      const gradeScores = studentMap[id].scores[domain] || {};
      // Find the highest grade where the student scored >= 70%
      const gradeLevels = ["K", "1", "2", "3", "4", "5"];
      let highestMastered = null;

      gradeLevels.forEach(g => {
        if (gradeScores[g] !== undefined && gradeScores[g] >= 70) {
          highestMastered = g;
        }
      });

      if (highestMastered !== null) {
        mastery[domain] = gradeLabels[highestMastered];
      } else if (Object.keys(gradeScores).length > 0) {
        // They've taken assessments but haven't hit 70% on any
        mastery[domain] = "Below Kindergarten";
      } else {
        mastery[domain] = "Not assessed";
      }
    });

    students.push({ id, name, mastery });
  });

  return students;
}

function populateStudentTable() {
  const students = getStudentData();
  const tbody = document.getElementById("student-table-body");
  tbody.innerHTML = "";

  if (students.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 5;
    td.textContent = "No assessment results yet. Students will appear here after completing an assessment.";
    td.style.padding = "30px";
    td.style.color = "#888";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  students.forEach(student => {
    const tr = document.createElement("tr");

    // Student name with clickable link
    const nameTd = document.createElement("td");
    const link = document.createElement("a");
    link.textContent = student.name;
    link.href = `student-report.html?id=${encodeURIComponent(student.id)}`;
    link.className = "student-link";
    nameTd.appendChild(link);
    tr.appendChild(nameTd);

    // Domain mastery columns
    ["OA", "NBT", "MD", "G"].forEach(domain => {
      const td = document.createElement("td");
      td.textContent = student.mastery[domain];
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
}

window.addEventListener("DOMContentLoaded", populateStudentTable);
