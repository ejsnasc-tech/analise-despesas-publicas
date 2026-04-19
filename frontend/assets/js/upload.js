async function enviarArquivo(event) {
  event.preventDefault();
  const input = document.getElementById('arquivo');
  const progress = document.querySelector('.progress > span');
  const btn = event.target.querySelector('button[type="submit"]');
  if (!input || !input.files || !input.files[0]) return;

  if (btn) { btn.disabled = true; btn.textContent = 'Analisando...'; }
  progress.style.width = '25%';
  const formData = new FormData();
  formData.append('file', input.files[0]);

  let response;
  try {
    response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
  } catch (err) {
    const resultado = document.getElementById('upload-resultado');
    resultado.textContent = 'Erro de conexão ao enviar arquivo.';
    if (btn) { btn.disabled = false; btn.textContent = 'Analisar Documento'; }
    progress.style.width = '0%';
    return;
  }

  progress.style.width = '80%';
  const payload = await response.json();
  progress.style.width = '100%';

  const resultado = document.getElementById('upload-resultado');
  if (!response.ok) {
    resultado.textContent = payload.message || 'Falha no upload';
    if (btn) { btn.disabled = false; btn.textContent = 'Analisar Documento'; }
    return;
  }

  // Redireciona para a página de análise completa
  if (payload.documentoId) {
    window.location.href = '/analise.html?id=' + encodeURIComponent(payload.documentoId);
  } else {
    resultado.textContent = 'Documento analisado com score ' + payload.resultado.score + '/100 - ' + payload.resultado.nivel;
  }
}

function bindUpload() {
  const form = document.getElementById('upload-form');
  if (form) form.addEventListener('submit', enviarArquivo);
}

window.AFUpload = { bindUpload };
