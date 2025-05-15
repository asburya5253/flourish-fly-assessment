// Mock student mastery data (replace with live data later)
const students = [
    {
      id: "s1",
      name: "Suzzy",
      mastery: {
        OA: "3rd Grade",
        NBT: "2nd Grade",
        MD: "1st Grade",
        G: "1st Grade"
      }
    },
    {
      id: "s2",
      name: "James",
      mastery: {
        OA: "2nd Grade",
        NBT: "3rd Grade",
        MD: "2nd Grade",
        G: "2nd Grade"
      }
    },
    {
      id: "s3",
      name: "Maria",
      mastery: {
        OA: "1st Grade",
        NBT: "1st Grade",
        MD: "Kindergarten",
        G: "Kindergarten"
      }
    }
  ];
  
  // Populate the student dashboard table
  function populateStudentTable() {
    const tbody = document.getElementById("student-table-body");
    tbody.innerHTML = "";
  
    students.forEach(student => {
      const tr = document.createElement("tr");
  
      // Student name with clickable link (link to student report)
      const nameTd = document.createElement("td");
      const link = document.createElement("a");
      link.textContent = student.name;
      link.href = `student-report.html?id=${student.id}`; // placeholder link
      link.className = "student-link";
      nameTd.appendChild(link);
      tr.appendChild(nameTd);
  
      // Domains mastery columns
      ["OA", "NBT", "MD", "G"].forEach(domain => {
        const td = document.createElement("td");
        td.textContent = student.mastery[domain] || "N/A";
        tr.appendChild(td);
      });
  
      tbody.appendChild(tr);
    });
  }
  
  // Run on page load
  window.addEventListener("DOMContentLoaded", populateStudentTable);
  