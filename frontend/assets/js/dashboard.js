const statsIds = {
  totalDocumentos: 'stat-total',
  documentosComIrregularidades: 'stat-alertas',
  documentosSemIrregularidades: 'stat-ok',
  documentosEmAnalise: 'stat-analise'
};

function animateValue(el, end) {
  const duration = 600;
  const start = 0;
  const startTime = performance.now();
  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = String(Math.round(start + (end - start) * eased));
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

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
    if (el) {
      const val = Number(data[key] ?? 0);
      if (val > 0) { animateValue(el, val); } else { el.textContent = '0'; }
    }
  });

  const lista = document.getElementById('recentes-lista');
  if (!lista) return;

  lista.innerHTML = '';
  const recentes = data.recentes || [];

  if (recentes.length === 0) {
    lista.innerHTML = '<li class="empty-state"><div class="empty-icon">📭</div><p>Nenhum documento analisado ainda</p></li>';
    return;
  }

  recentes.forEach((item, i) => {
    const li = document.createElement('li');
    li.className = 'recent-item fade-in';
    li.style.animationDelay = (i * 0.08) + 's';

    const ext = (item.nome_arquivo || '').split('.').pop().toUpperCase();
    const iconMap = { PDF: '📕', CSV: '📗', XLSX: '📊', XML: '📋', JSON: '📄' };

    li.innerHTML =
      '<div class="recent-icon">' + (iconMap[ext] || '📄') + '</div>' +
      '<div class="recent-info">' +
        '<strong>' + escapeHtml(item.nome_arquivo) + '</strong>' +
        '<small>Score: ' + (item.score ?? '—') + '/100</small>' +
      '</div>' +
      '<span class="badge ' + String(item.nivel || '').toLowerCase() + '">' + (item.nivel || '—') + '</span>' +
      '<div class="recent-action"><a href="/analise.html?id=' + encodeURIComponent(item.id) + '">Ver →</a></div>';

    lista.appendChild(li);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

window.AFDashboard = { carregarDashboard };
