document.getElementById('signup-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const firstName = document.getElementById('signup-first-name').value.trim();
    const lastName = document.getElementById('signup-last-name').value.trim();
    const gradeLevel = document.getElementById('signup-grade-level').value;
    const teacherType = document.getElementById('signup-teacher-type').value;
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    const errorMsg = document.getElementById('signup-error');
    const successMsg = document.getElementById('signup-success');

    errorMsg.classList.add('hidden');
    successMsg.classList.add('hidden');

    if (!firstName || !lastName || !gradeLevel || !teacherType || !email || !password || !confirmPassword) {
      errorMsg.textContent = 'Please fill in all fields.';
      errorMsg.classList.remove('hidden');
      return;
    }

    if (password !== confirmPassword) {
      errorMsg.textContent = 'Passwords do not match.';
      errorMsg.classList.remove('hidden');
      return;
    }

    if (password.length < 6) {
      errorMsg.textContent = 'Password must be at least 6 characters.';
      errorMsg.classList.remove('hidden');
      return;
    }

    let teachers = JSON.parse(localStorage.getItem('teachers') || '[]');

    const existingTeacher = teachers.find(t => t.email === email);
    if (existingTeacher) {
      errorMsg.textContent = 'This email is already registered.';
      errorMsg.classList.remove('hidden');
      return;
    }

    teachers.push({ firstName, lastName, gradeLevel, teacherType, email, password });
    localStorage.setItem('teachers', JSON.stringify(teachers));

    successMsg.classList.remove('hidden');
    document.getElementById('signup-form').reset();
  });
