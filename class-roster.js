const ROSTER_KEY = "classRoster";
const STUDENT_ROSTER_KEY = "studentRoster"; // legacy map used by dashboard

const gradeLabels = {
  "K": "Kindergarten", "1": "1st Grade", "2": "2nd Grade",
  "3": "3rd Grade", "4": "4th Grade", "5": "5th Grade",
  "6": "6th Grade", "7": "7th Grade", "8": "8th Grade",
  "9": "9th Grade", "10": "10th Grade", "11": "11th Grade",
  "12": "12th Grade"
};

// ── Roster helpers ──────────────────────────────────────────

function getRoster() {
  return JSON.parse(localStorage.getItem(ROSTER_KEY) || "[]");
}

function saveRoster(roster) {
  localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));
  syncStudentRoster(roster);
}

// Keep the simple id→name map that the dashboard uses in sync
function syncStudentRoster(roster) {
  const map = {};
  roster.forEach(s => {
    const id = (s.firstName + "_" + s.lastName).toLowerCase().replace(/\s+/g, "_");
    map[id] = s.firstName + " " + s.lastName;
  });
  localStorage.setItem(STUDENT_ROSTER_KEY, JSON.stringify(map));
}

function addStudents(students) {
  const roster = getRoster();
  students.forEach(s => roster.push(s));
  saveRoster(roster);
}

function removeStudent(index) {
  const roster = getRoster();
  roster.splice(index, 1);
  saveRoster(roster);
  renderRoster();
}

function clearRoster() {
  saveRoster([]);
  renderRoster();
}

// ── Render ──────────────────────────────────────────────────

function renderRoster() {
  const roster = getRoster();
  const tbody = document.getElementById("roster-body");
  const emptyMsg = document.getElementById("empty-roster");
  const clearBtn = document.getElementById("btn-clear-all");
  const countEl = document.getElementById("roster-count");

  tbody.innerHTML = "";

  if (roster.length === 0) {
    emptyMsg.classList.remove("hidden");
    clearBtn.classList.add("hidden");
    countEl.textContent = "";
    return;
  }

  emptyMsg.classList.add("hidden");
  clearBtn.classList.remove("hidden");
  countEl.textContent = roster.length + " student" + (roster.length !== 1 ? "s" : "");

  roster.forEach((s, i) => {
    const tr = document.createElement("tr");

    tr.innerHTML =
      "<td>" + escapeHtml(s.firstName) + "</td>" +
      "<td>" + escapeHtml(s.lastName) + "</td>" +
      "<td>" + (gradeLabels[s.gradeLevel] || s.gradeLevel) + "</td>" +
      "<td>" + (gradeLabels[s.mathLevel] || s.mathLevel) + "</td>" +
      "<td>" + escapeHtml(s.classPeriod || "—") + "</td>" +
      "<td><button class='btn-remove' data-index='" + i + "'>Remove</button></td>";

    tbody.appendChild(tr);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ── Manual entry ────────────────────────────────────────────

function handleManualAdd() {
  const firstName = document.getElementById("m-first-name").value.trim();
  const lastName = document.getElementById("m-last-name").value.trim();
  const gradeLevel = document.getElementById("m-grade-level").value;
  const mathLevel = document.getElementById("m-math-level").value;
  const classPeriod = document.getElementById("m-class-period").value.trim();
  const status = document.getElementById("manual-status");

  if (!firstName || !lastName || !gradeLevel || !mathLevel) {
    status.textContent = "Please fill in all required fields.";
    status.style.color = "red";
    return;
  }

  addStudents([{ firstName, lastName, gradeLevel, mathLevel, classPeriod }]);

  // Reset form
  document.getElementById("m-first-name").value = "";
  document.getElementById("m-last-name").value = "";
  document.getElementById("m-grade-level").selectedIndex = 0;
  document.getElementById("m-math-level").selectedIndex = 0;
  document.getElementById("m-class-period").value = "";

  status.textContent = firstName + " " + lastName + " added!";
  status.style.color = "green";

  renderRoster();
}

// ── CSV upload ──────────────────────────────────────────────

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== "");
  if (lines.length < 2) return { students: [], error: "File is empty or has no data rows." };

  const header = lines[0].split(",").map(h => h.trim().toLowerCase());

  // Try to find columns by name
  const firstIdx = header.findIndex(h => h.includes("first"));
  const lastIdx = header.findIndex(h => h.includes("last"));
  const gradeIdx = header.findIndex(h => h.includes("grade"));
  const mathIdx = header.findIndex(h => h.includes("math"));
  const classIdx = header.findIndex(h => h.includes("class") || h.includes("period"));

  if (firstIdx === -1 || lastIdx === -1 || gradeIdx === -1 || mathIdx === -1) {
    return {
      students: [],
      error: "Could not find required columns. Please include: First Name, Last Name, Grade Level, Math Level."
    };
  }

  const students = [];
  const errors = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map(c => c.trim());
    const firstName = cols[firstIdx] || "";
    const lastName = cols[lastIdx] || "";
    const gradeLevel = cols[gradeIdx] || "";
    const mathLevel = cols[mathIdx] || "";
    const classPeriod = classIdx !== -1 ? (cols[classIdx] || "") : "";

    if (!firstName || !lastName) {
      errors.push("Row " + (i + 1) + ": missing name, skipped.");
      continue;
    }

    students.push({ firstName, lastName, gradeLevel, mathLevel, classPeriod });
  }

  return { students, errors };
}

function handleFileUpload(file) {
  const statusEl = document.getElementById("upload-status");

  if (!file || !file.name.endsWith(".csv")) {
    statusEl.innerHTML = "<span class='status-error'>Please upload a .csv file.</span>";
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const result = parseCSV(e.target.result);

    if (result.error) {
      statusEl.innerHTML = "<span class='status-error'>" + result.error + "</span>";
      return;
    }

    if (result.students.length === 0) {
      statusEl.innerHTML = "<span class='status-error'>No valid students found in file.</span>";
      return;
    }

    addStudents(result.students);
    renderRoster();

    let msg = "<span class='status-success'>" + result.students.length + " student" +
      (result.students.length !== 1 ? "s" : "") + " imported!</span>";

    if (result.errors.length > 0) {
      msg += "<br><span class='status-error'>" + result.errors.join("<br>") + "</span>";
    }

    statusEl.innerHTML = msg;
  };

  reader.readAsText(file);
}

// ── Event listeners ─────────────────────────────────────────

document.addEventListener("DOMContentLoaded", function () {
  renderRoster();

  // Manual add button
  document.getElementById("btn-add-student").addEventListener("click", handleManualAdd);

  // Upload area click → open file picker
  document.getElementById("upload-area").addEventListener("click", function () {
    document.getElementById("file-input").click();
  });

  // File selected
  document.getElementById("file-input").addEventListener("change", function () {
    if (this.files.length > 0) {
      handleFileUpload(this.files[0]);
      this.value = ""; // allow re-upload of same file
    }
  });

  // Remove buttons (delegated)
  document.getElementById("roster-body").addEventListener("click", function (e) {
    if (e.target.classList.contains("btn-remove")) {
      const idx = parseInt(e.target.getAttribute("data-index"), 10);
      removeStudent(idx);
    }
  });

  // Clear all
  document.getElementById("btn-clear-all").addEventListener("click", function () {
    if (confirm("Remove all students from the roster?")) {
      clearRoster();
    }
  });
});
