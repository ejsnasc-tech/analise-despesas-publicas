const statsIds = {
  totalDocumentos: 'stat-total',
  documentosComIrregularidades: 'stat-alertas',
  documentosSemIrregularidades: 'stat-ok',
  documentosEmAnalise: 'stat-analise'
};

async function carregarDashboard() {
  let response;
  try {
    response = await fetch('/api/dashboard');
  } catch (err) {
    console.error('Erro de rede ao carregar dashboard:', err);
    return;
  }
  if (response.status === 401) {
    window.location.href = '/login';
    return;
  }

  const data = await response.json();
  Object.entries(statsIds).forEach(([key, id]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(data[key] ?? 0);
  });

  const lista = document.getElementById('recentes-lista');
  if (!lista) return;

  lista.innerHTML = '';
  (data.recentes || []).forEach((item) => {
    const li = document.createElement('li');

    const nomeText = document.createTextNode(item.nome_arquivo + ' ');
    li.appendChild(nomeText);

    const badge = document.createElement('span');
    badge.className = 'badge ' + String(item.nivel).toLowerCase();
    badge.textContent = item.nivel;
    li.appendChild(badge);

    const spacer = document.createTextNode(' ');
    li.appendChild(spacer);

    const link = document.createElement('a');
    link.href = '/analise.html?id=' + encodeURIComponent(item.id);
    link.textContent = 'Ver Resultado';
    li.appendChild(link);

    lista.appendChild(li);
  });
}

window.AFDashboard = { carregarDashboard };
