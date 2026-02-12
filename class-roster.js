const ROSTER_KEY = "classRoster";
const STUDENT_ROSTER_KEY = "studentRoster";

const gradeLabels = {
  "K": "Kindergarten", "1": "1st Grade", "2": "2nd Grade",
  "3": "3rd Grade", "4": "4th Grade", "5": "5th Grade",
  "6": "6th Grade", "7": "7th Grade", "8": "8th Grade",
  "9": "9th Grade", "10": "10th Grade", "11": "11th Grade",
  "12": "12th Grade"
};

const gradeLevelOptions = ["", "K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const mathLevelOptions = ["", "K", "1", "2", "3", "4", "5", "6", "7", "8"];

var editingRow = -1;

// ── Login ID generation ─────────────────────────────────────

function generateLoginId(firstName, lastName, existingIds) {
  var base = (firstName.slice(0, 3) + lastName.slice(0, 3)).toLowerCase();
  if (existingIds.indexOf(base) === -1) return base;
  var num = 1;
  while (existingIds.indexOf(base + num) !== -1) {
    num++;
  }
  return base + num;
}

function getAllLoginIds(roster) {
  return roster.map(function (s) { return s.loginId || ""; });
}

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
    if (s.loginId) {
      map[s.loginId] = s.firstName + " " + s.lastName;
    }
  });
  localStorage.setItem(STUDENT_ROSTER_KEY, JSON.stringify(map));
}

function addStudents(students) {
  var roster = getRoster();
  var existingIds = getAllLoginIds(roster);

  students.forEach(function (s) {
    s.loginId = generateLoginId(s.firstName, s.lastName, existingIds);
    existingIds.push(s.loginId);
    roster.push(s);
  });

  saveRoster(roster);
}

function removeStudent(index) {
  var roster = getRoster();
  roster.splice(index, 1);
  saveRoster(roster);
  editingRow = -1;
  renderRoster();
}

function clearRoster() {
  saveRoster([]);
  editingRow = -1;
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

function displayValue(val, labelMap) {
  if (!val) return "—";
  return labelMap[val] || val;
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
    var isEditing = (i === editingRow);

    // Login ID
    var tdId = document.createElement("td");
    tdId.textContent = s.loginId || "—";
    tdId.style.fontFamily = "monospace";
    tdId.style.fontWeight = "600";
    tr.appendChild(tdId);

    // First name
    var tdFirst = document.createElement("td");
    tdFirst.textContent = s.firstName;
    tr.appendChild(tdFirst);

    // Last name
    var tdLast = document.createElement("td");
    tdLast.textContent = s.lastName;
    tr.appendChild(tdLast);

    // Grade level
    var tdGrade = document.createElement("td");
    if (isEditing) {
      tdGrade.appendChild(buildSelect(gradeLevelOptions, s.gradeLevel || "", i, "gradeLevel"));
    } else {
      tdGrade.textContent = displayValue(s.gradeLevel, gradeLabels);
    }
    tr.appendChild(tdGrade);

    // Math level
    var tdMath = document.createElement("td");
    if (isEditing) {
      tdMath.appendChild(buildSelect(mathLevelOptions, s.mathLevel || "", i, "mathLevel"));
    } else {
      tdMath.textContent = displayValue(s.mathLevel, gradeLabels);
    }
    tr.appendChild(tdMath);

    // Class period
    var tdClass = document.createElement("td");
    if (isEditing) {
      var classInput = document.createElement("input");
      classInput.type = "text";
      classInput.value = s.classPeriod || "";
      classInput.placeholder = "—";
      classInput.setAttribute("data-index", i);
      classInput.setAttribute("data-field", "classPeriod");
      tdClass.appendChild(classInput);
    } else {
      tdClass.textContent = s.classPeriod || "—";
    }
    tr.appendChild(tdClass);

    // Action buttons
    var tdActions = document.createElement("td");
    if (isEditing) {
      var saveBtn = document.createElement("button");
      saveBtn.className = "btn-save";
      saveBtn.setAttribute("data-index", i);
      saveBtn.textContent = "Save";
      tdActions.appendChild(saveBtn);
    } else {
      var editBtn = document.createElement("button");
      editBtn.className = "btn-edit";
      editBtn.setAttribute("data-index", i);
      editBtn.textContent = "Edit";
      tdActions.appendChild(editBtn);
    }
    var removeBtn = document.createElement("button");
    removeBtn.className = "btn-remove";
    removeBtn.setAttribute("data-index", i);
    removeBtn.textContent = "Remove";
    tdActions.appendChild(removeBtn);
    tr.appendChild(tdActions);

    tbody.appendChild(tr);
  });
}

// ── Save edits from a row ───────────────────────────────────

function saveRow(index) {
  var roster = getRoster();
  if (!roster[index]) return;

  var tbody = document.getElementById("roster-body");
  var row = tbody.children[index];
  if (!row) return;

  var selects = row.querySelectorAll("select");
  selects.forEach(function (sel) {
    var field = sel.getAttribute("data-field");
    roster[index][field] = sel.value;
  });

  var inputs = row.querySelectorAll("input[type='text']");
  inputs.forEach(function (inp) {
    var field = inp.getAttribute("data-field");
    roster[index][field] = inp.value.trim();
  });

  saveRoster(roster);
  editingRow = -1;
  renderRoster();
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

  editingRow = -1;
  renderRoster();
}

// ── CSV upload ──────────────────────────────────────────────

function parseCSV(text) {
  var lines = text.split(/\r?\n/).filter(function (l) { return l.trim() !== ""; });
  if (lines.length < 2) return { students: [], error: "File is empty or has no data rows." };

  var header = lines[0].split(",").map(function (h) { return h.trim().toLowerCase(); });

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
    editingRow = -1;
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

  document.getElementById("btn-add-student").addEventListener("click", handleManualAdd);

  document.getElementById("upload-area").addEventListener("click", function () {
    document.getElementById("file-input").click();
  });

  document.getElementById("file-input").addEventListener("change", function () {
    if (this.files.length > 0) {
      handleFileUpload(this.files[0]);
      this.value = "";
    }
  });

  var rosterBody = document.getElementById("roster-body");

  rosterBody.addEventListener("click", function (e) {
    var target = e.target;
    var idx = parseInt(target.getAttribute("data-index"), 10);

    if (target.classList.contains("btn-edit")) {
      editingRow = idx;
      renderRoster();
    } else if (target.classList.contains("btn-save")) {
      saveRow(idx);
    } else if (target.classList.contains("btn-remove")) {
      removeStudent(idx);
    }
  });

  document.getElementById("btn-clear-all").addEventListener("click", function () {
    if (confirm("Remove all students from the roster?")) {
      clearRoster();
    }
  });
});
