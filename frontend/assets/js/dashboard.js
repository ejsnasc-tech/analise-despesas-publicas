const statsIds = {
  totalDocumentos: 'stat-total',
  documentosComIrregularidades: 'stat-alertas',
  documentosSemIrregularidades: 'stat-ok',
  documentosEmAnalise: 'stat-analise'
};

async function carregarDashboard() {
  const response = await fetch('/api/dashboard');
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
    li.innerHTML = `${item.nome_arquivo} <span class="badge ${String(item.nivel).toLowerCase()}">${item.nivel}</span> <a href="/analise.html?id=${item.id}">Ver Resultado</a>`;
    lista.appendChild(li);
  });
}

window.AFDashboard = { carregarDashboard };
