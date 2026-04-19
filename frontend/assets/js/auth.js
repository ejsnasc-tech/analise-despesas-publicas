async function login(event) {
  event.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (response.ok) {
      window.location.href = '/dashboard.html';
      return;
    }
  } catch (err) {
    console.error('Erro de rede ao fazer login:', err);
  }

  const card = document.querySelector('.login-card');
  if (!card) return;
  card.classList.remove('shake');
  void card.offsetWidth;
  card.classList.add('shake');
}

function bindLogin() {
  const form = document.getElementById('login-form');
  if (form) form.addEventListener('submit', login);
}

async function logout() {
  await fetch('/logout');
  window.location.href = '/login';
}

window.AFAuth = { bindLogin, logout };
