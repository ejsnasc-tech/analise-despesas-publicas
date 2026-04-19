async function carregarDocumentos(page = 1) {
  const status = document.getElementById('f-status')?.value || '';
  const tipo = document.getElementById('f-tipo')?.value || '';
  const busca = document.getElementById('f-busca')?.value || '';

  const params = new URLSearchParams({ page: String(page) });
  if (status) params.set('status', status);
  if (tipo) params.set('tipo', tipo);
  if (busca) params.set('busca', busca);

  let response;
  try {
    response = await fetch(`/api/documentos?${params.toString()}`);
  } catch (err) {
    console.error('Erro de rede ao carregar documentos:', err);
    return;
  }
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

    const fields = [doc.id, doc.nome_arquivo, doc.tipo, doc.status, doc.score];
    fields.forEach((value) => {
      const td = document.createElement('td');
      td.textContent = String(value);
      tr.appendChild(td);
    });

    const tdNivel = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = 'badge ' + String(doc.nivel).toLowerCase();
    badge.textContent = doc.nivel;
    tdNivel.appendChild(badge);
    tr.appendChild(tdNivel);

    const tdActions = document.createElement('td');
    const linkAnalise = document.createElement('a');
    linkAnalise.href = '/analise.html?id=' + encodeURIComponent(doc.id);
    linkAnalise.textContent = 'Ver análise';
    tdActions.appendChild(linkAnalise);
    tdActions.appendChild(document.createTextNode(' | '));
    const linkDownload = document.createElement('a');
    linkDownload.href = '#';
    linkDownload.setAttribute('data-download', doc.id);
    linkDownload.textContent = 'Download';
    tdActions.appendChild(linkDownload);
    tdActions.appendChild(document.createTextNode(' | '));
    const linkDelete = document.createElement('a');
    linkDelete.href = '#';
    linkDelete.setAttribute('data-delete', doc.id);
    linkDelete.textContent = 'Excluir';
    tdActions.appendChild(linkDelete);
    tr.appendChild(tdActions);

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
