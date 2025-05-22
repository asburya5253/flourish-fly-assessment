document.getElementById('signup-form').addEventListener('submit', function (e) {
    e.preventDefault();
  
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value.trim();
    const errorMsg = document.getElementById('signup-error');
    const successMsg = document.getElementById('signup-success');
  
    errorMsg.classList.add('hidden');
    successMsg.classList.add('hidden');
  
    if (!email || !password) {
      errorMsg.textContent = 'Please fill in all fields.';
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
  
    teachers.push({ email, password });
    localStorage.setItem('teachers', JSON.stringify(teachers));
  
    successMsg.classList.remove('hidden');
    document.getElementById('signup-form').reset();
  });
  