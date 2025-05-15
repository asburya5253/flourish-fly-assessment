const studentMastery = {
    name: "Suzzy",
    mastery: {
      OA: { "K": 90, "1": 85, "2": 75, "3": 60, "4": 50, "5": 40 },
      NBT: { "K": 95, "1": 90, "2": 85, "3": 80, "4": 70, "5": 65 },
      MD: { "K": 70, "1": 60, "2": 55, "3": 50, "4": 45, "5": 40 },
      G: { "K": 65, "1": 60, "2": 55, "3": 50, "4": 45, "5": 40 }
    }
  };
  
  const domains = ["OA", "NBT", "MD", "G"];
  const grades = ["K", "1", "2", "3", "4", "5"];
  
  function renderReport() {
    document.getElementById("student-name").textContent = studentMastery.name;
  
    const tbody = document.getElementById("report-body");
    tbody.innerHTML = "";
  
    domains.forEach(domain => {
      const tr = document.createElement("tr");
  
      // Domain name clickable cell
      const domainTd = document.createElement("td");
      domainTd.textContent = domain;
      domainTd.classList.add("clickable");
      domainTd.onclick = () => {
        // Redirect to domain detail report page for this student
        window.location.href = `domain-report.html?student=${encodeURIComponent(studentMastery.name)}&domain=${domain}`;
      };
      tr.appendChild(domainTd);
  
      // Mastery % per grade with links
      grades.forEach(grade => {
        const td = document.createElement("td");
        td.textContent = studentMastery.mastery[domain][grade] + "%";
        td.classList.add("clickable");
        td.onclick = () => {
          // Redirect to grade-level report page for this student & grade
          window.location.href = `grade-report.html?student=${encodeURIComponent(studentMastery.name)}&grade=${grade}`;
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
        // Redirect to grade-level report page for this student & grade
        window.location.href = `grade-report.html?student=${encodeURIComponent(studentMastery.name)}&grade=${grade}`;
      };
    });
  }
  
  window.addEventListener("DOMContentLoaded", renderReport);
  