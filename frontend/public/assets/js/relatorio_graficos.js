// Gráficos do relatório usando Chart.js
// Este arquivo deve ser incluído em analise.html

// Carrega Chart.js dinamicamente se não estiver presente
function loadChartJs(callback) {
  if (window.Chart) return callback();
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
  script.onload = callback;
  document.head.appendChild(script);
}

// Renderiza gráfico de pizza dos tipos de alerta
function renderAlertasPie(alertas) {
  const ctx = document.getElementById('grafico-alertas').getContext('2d');
  const counts = {};
  alertas.forEach(a => { counts[a.tipo] = (counts[a.tipo]||0)+1; });
  const tipos = Object.keys(counts);
  const valores = Object.values(counts);
  if (window._graficoAlertas) window._graficoAlertas.destroy();
  window._graficoAlertas = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: tipos,
      datasets: [{
        data: valores,
        backgroundColor: tipos.map((_,i)=>`hsl(${i*360/tipos.length},70%,60%)`)
      }]
    },
    options: {
      plugins: { legend: { position: 'bottom' } },
      responsive: true
    }
  });
}

// Gráfico de barras para pontuação dos alertas
function renderAlertasBar(alertas) {
  const ctx = document.getElementById('grafico-pontos').getContext('2d');
  const porTipo = {};
  alertas.forEach(a => { porTipo[a.tipo] = (porTipo[a.tipo]||0)+(a.pontuacao||0); });
  const tipos = Object.keys(porTipo);
  const pontos = Object.values(porTipo);
  if (window._graficoPontos) window._graficoPontos.destroy();
  window._graficoPontos = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: tipos,
      datasets: [{
        label: 'Pontuação de Risco',
        data: pontos,
        backgroundColor: tipos.map((_,i)=>`hsl(${i*360/tipos.length},70%,60%)`)
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      responsive: true,
      scales: { y: { beginAtZero: true } }
    }
  });
}

window.RelatorioGraficos = { loadChartJs, renderAlertasPie, renderAlertasBar };
