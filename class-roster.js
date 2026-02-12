const ROSTER_KEY = "classRoster";
const STUDENT_ROSTER_KEY = "studentRoster"; // map used by dashboard

const gradeLabels = {
  "K": "Kindergarten", "1": "1st Grade", "2": "2nd Grade",
  "3": "3rd Grade", "4": "4th Grade", "5": "5th Grade",
  "6": "6th Grade", "7": "7th Grade", "8": "8th Grade",
  "9": "9th Grade", "10": "10th Grade", "11": "11th Grade",
  "12": "12th Grade"
};

const gradeLevelOptions = ["", "K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const mathLevelOptions = ["", "K", "1", "2", "3", "4", "5", "6", "7", "8"];

// ── Roster helpers ──────────────────────────────────────────

function getRoster() {
  return JSON.parse(localStorage.getItem(ROSTER_KEY) || "[]");
}

function saveRoster(roster) {
  localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));
  syncStudentRoster(roster);
}

function syncStudentRoster(roster) {
  var map = {};
  roster.forEach(function (s) {
    var id = (s.firstName + "_" + s.lastName).toLowerCase().replace(/\s+/g, "_");
    map[id] = s.firstName + " " + s.lastName;
  });
  localStorage.setItem(STUDENT_ROSTER_KEY, JSON.stringify(map));
}

function addStudents(students) {
  var roster = getRoster();
  students.forEach(function (s) { roster.push(s); });
  saveRoster(roster);
}

function updateStudent(index, field, value) {
  var roster = getRoster();
  if (roster[index]) {
    roster[index][field] = value;
    saveRoster(roster);
  }
}

function removeStudent(index) {
  var roster = getRoster();
  roster.splice(index, 1);
  saveRoster(roster);
  renderRoster();
}

function clearRoster() {
  saveRoster([]);
  renderRoster();
}

// ── Build dropdown ──────────────────────────────────────────

function buildSelect(options, selectedVal, dataIndex, field) {
  var sel = document.createElement("select");
  sel.setAttribute("data-index", dataIndex);
  sel.setAttribute("data-field", field);

  options.forEach(function (val) {
    var opt = document.createElement("option");
    opt.value = val;
    opt.textContent = val === "" ? "—" : (gradeLabels[val] || val);
    if (val === selectedVal) opt.selected = true;
    sel.appendChild(opt);
  });

  return sel;
}

// ── Render ──────────────────────────────────────────────────

function renderRoster() {
  var roster = getRoster();
  var tbody = document.getElementById("roster-body");
  var emptyMsg = document.getElementById("empty-roster");
  var clearBtn = document.getElementById("btn-clear-all");
  var countEl = document.getElementById("roster-count");

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

  roster.forEach(function (s, i) {
    var tr = document.createElement("tr");

    // First name (text)
    var tdFirst = document.createElement("td");
    tdFirst.textContent = s.firstName;
    tr.appendChild(tdFirst);

    // Last name (text)
    var tdLast = document.createElement("td");
    tdLast.textContent = s.lastName;
    tr.appendChild(tdLast);

    // Grade level (dropdown)
    var tdGrade = document.createElement("td");
    tdGrade.appendChild(buildSelect(gradeLevelOptions, s.gradeLevel || "", i, "gradeLevel"));
    tr.appendChild(tdGrade);

    // Math level (dropdown)
    var tdMath = document.createElement("td");
    tdMath.appendChild(buildSelect(mathLevelOptions, s.mathLevel || "", i, "mathLevel"));
    tr.appendChild(tdMath);

    // Class period (editable text input)
    var tdClass = document.createElement("td");
    var classInput = document.createElement("input");
    classInput.type = "text";
    classInput.value = s.classPeriod || "";
    classInput.placeholder = "—";
    classInput.setAttribute("data-index", i);
    classInput.setAttribute("data-field", "classPeriod");
    tdClass.appendChild(classInput);
    tr.appendChild(tdClass);

    // Remove button
    var tdRemove = document.createElement("td");
    var btn = document.createElement("button");
    btn.className = "btn-remove";
    btn.setAttribute("data-index", i);
    btn.textContent = "Remove";
    tdRemove.appendChild(btn);
    tr.appendChild(tdRemove);

    tbody.appendChild(tr);
  });
}

function escapeHtml(str) {
  var div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ── Manual entry ────────────────────────────────────────────

function handleManualAdd() {
  var firstName = document.getElementById("m-first-name").value.trim();
  var lastName = document.getElementById("m-last-name").value.trim();
  var gradeLevel = document.getElementById("m-grade-level").value;
  var mathLevel = document.getElementById("m-math-level").value;
  var classPeriod = document.getElementById("m-class-period").value.trim();
  var status = document.getElementById("manual-status");

  if (!firstName || !lastName) {
    status.textContent = "Please enter a first and last name.";
    status.style.color = "red";
    return;
  }

  addStudents([{ firstName: firstName, lastName: lastName, gradeLevel: gradeLevel, mathLevel: mathLevel, classPeriod: classPeriod }]);

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
  var lines = text.split(/\r?\n/).filter(function (l) { return l.trim() !== ""; });
  if (lines.length < 2) return { students: [], error: "File is empty or has no data rows." };

  var header = lines[0].split(",").map(function (h) { return h.trim().toLowerCase(); });

  // Find columns — only first and last name are required
  var firstIdx = header.findIndex(function (h) { return h.includes("first"); });
  var lastIdx = header.findIndex(function (h) { return h.includes("last"); });
  var gradeIdx = header.findIndex(function (h) { return h.includes("grade") && !h.includes("math"); });
  var mathIdx = header.findIndex(function (h) { return h.includes("math"); });
  var classIdx = header.findIndex(function (h) { return h.includes("class") || h.includes("period"); });

  if (firstIdx === -1 || lastIdx === -1) {
    return {
      students: [],
      error: "Could not find required columns. Please include at least: First Name, Last Name."
    };
  }

  var students = [];
  var errors = [];

  for (var i = 1; i < lines.length; i++) {
    var cols = lines[i].split(",").map(function (c) { return c.trim(); });
    var firstName = cols[firstIdx] || "";
    var lastName = cols[lastIdx] || "";
    var gradeLevel = gradeIdx !== -1 ? (cols[gradeIdx] || "") : "";
    var mathLevel = mathIdx !== -1 ? (cols[mathIdx] || "") : "";
    var classPeriod = classIdx !== -1 ? (cols[classIdx] || "") : "";

    if (!firstName || !lastName) {
      errors.push("Row " + (i + 1) + ": missing name, skipped.");
      continue;
    }

    students.push({ firstName: firstName, lastName: lastName, gradeLevel: gradeLevel, mathLevel: mathLevel, classPeriod: classPeriod });
  }

  return { students: students, errors: errors };
}

function handleFileUpload(file) {
  var statusEl = document.getElementById("upload-status");

  if (!file || !file.name.endsWith(".csv")) {
    statusEl.innerHTML = "<span class='status-error'>Please upload a .csv file.</span>";
    return;
  }

  var reader = new FileReader();
  reader.onload = function (e) {
    var result = parseCSV(e.target.result);

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

    var msg = "<span class='status-success'>" + result.students.length + " student" +
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

  // Upload area click
  document.getElementById("upload-area").addEventListener("click", function () {
    document.getElementById("file-input").click();
  });

  // File selected
  document.getElementById("file-input").addEventListener("change", function () {
    if (this.files.length > 0) {
      handleFileUpload(this.files[0]);
      this.value = "";
    }
  });

  // Delegated events on roster table body
  var rosterBody = document.getElementById("roster-body");

  // Remove buttons
  rosterBody.addEventListener("click", function (e) {
    if (e.target.classList.contains("btn-remove")) {
      var idx = parseInt(e.target.getAttribute("data-index"), 10);
      removeStudent(idx);
    }
  });

  // Inline select changes (grade level, math level)
  rosterBody.addEventListener("change", function (e) {
    if (e.target.tagName === "SELECT") {
      var idx = parseInt(e.target.getAttribute("data-index"), 10);
      var field = e.target.getAttribute("data-field");
      updateStudent(idx, field, e.target.value);
    }
  });

  // Inline text input changes (class period) — save on blur
  rosterBody.addEventListener("focusout", function (e) {
    if (e.target.tagName === "INPUT" && e.target.type === "text") {
      var idx = parseInt(e.target.getAttribute("data-index"), 10);
      var field = e.target.getAttribute("data-field");
      updateStudent(idx, field, e.target.value.trim());
    }
  });

  // Clear all
  document.getElementById("btn-clear-all").addEventListener("click", function () {
    if (confirm("Remove all students from the roster?")) {
      clearRoster();
    }
  });
});
