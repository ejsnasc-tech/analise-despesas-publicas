async function enviarArquivo(event) {
  event.preventDefault();
  const input = document.getElementById('arquivo');
  const progress = document.querySelector('.progress > span');
  if (!input || !input.files || !input.files[0]) return;

  progress.style.width = '25%';
  const formData = new FormData();
  formData.append('file', input.files[0]);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });

  progress.style.width = '80%';
  const payload = await response.json();
  progress.style.width = '100%';

  const resultado = document.getElementById('upload-resultado');
  if (!response.ok) {
    resultado.textContent = payload.message || 'Falha no upload';
    return;
  }

  resultado.innerHTML = `Documento analisado com score <strong>${payload.resultado.score}/100</strong> e nível <strong>${payload.resultado.nivel}</strong>.`;
}

function bindUpload() {
  const form = document.getElementById('upload-form');
  if (form) form.addEventListener('submit', enviarArquivo);
}

window.AFUpload = { bindUpload };
