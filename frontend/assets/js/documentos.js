async function carregarDocumentos(page = 1) {
  const status = document.getElementById('f-status')?.value || '';
  const tipo = document.getElementById('f-tipo')?.value || '';
  const busca = document.getElementById('f-busca')?.value || '';

  const params = new URLSearchParams({ page: String(page) });
  if (status) params.set('status', status);
  if (tipo) params.set('tipo', tipo);
  if (busca) params.set('busca', busca);

  const response = await fetch(`/api/documentos?${params.toString()}`);
  if (response.status === 401) {
    window.location.href = '/login';
    return;
  }

  const data = await response.json();
  const tbody = document.getElementById('documentos-body');
  if (!tbody) return;

  tbody.innerHTML = '';
  data.items.forEach((doc) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${doc.id}</td>
      <td>${doc.nome_arquivo}</td>
      <td>${doc.tipo}</td>
      <td>${doc.status}</td>
      <td>${doc.score}</td>
      <td><span class="badge ${String(doc.nivel).toLowerCase()}">${doc.nivel}</span></td>
      <td>
        <a href="/analise.html?id=${doc.id}">Ver análise</a> |
        <a href="#" data-download="${doc.id}">Download</a> |
        <a href="#" data-delete="${doc.id}">Excluir</a>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('[data-download]').forEach((link) => {
    link.addEventListener('click', async (event) => {
      event.preventDefault();
      const id = event.currentTarget.getAttribute('data-download');
      const dl = await fetch(`/api/documentos/${id}/download`);
      const payload = await dl.json();
      window.location.href = payload.downloadUrl;
    });
  });

  tbody.querySelectorAll('[data-delete]').forEach((link) => {
    link.addEventListener('click', async (event) => {
      event.preventDefault();
      const id = event.currentTarget.getAttribute('data-delete');
      await fetch(`/api/documentos/${id}`, { method: 'DELETE' });
      carregarDocumentos(page);
    });
  });
}

window.AFDocumentos = { carregarDocumentos };
