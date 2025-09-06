const WETHER_PALETTE = {
  'Hopeful': '#4CAF50',
  'Angry': '#F44336',
  'Sad': '#2196F3',
  'Neutral': '#9E9E9E',
  'Anxious': '#FFC107'
};

function createGlobalChart(container, data, opts = {}) {
  const tpl = document.getElementById('global-chart-template');
  const node = tpl.content.cloneNode(true);
  container.appendChild(node);

  const card = container.querySelector('.gc-card:last-child');
  const canvas = card.querySelector('canvas');
  const legendEl = card.querySelector('.gc-legend');
  const toplabel = card.querySelector('.gc-toplabel');
  const exportBtn = card.querySelector('.gc-export-btn');

  const labels = data.labels.map(l => {
    const mapping = {
      '🌱 Hopeful':'Hopeful','Hopeful':'Hopeful','hopeful':'Hopeful',
      '🔥 Angry':'Angry','Angry':'Angry','angry':'Angry',
      '💧 Sad':'Sad','Sad':'Sad','sad':'Sad',
      '⚪ Neutral':'Neutral','Neutral':'Neutral','neutral':'Neutral',
      '⚡ Anxious':'Anxious','Anxious':'Anxious','anxious':'Anxious'
    };
    return mapping[String(l).trim()] || l;
  });
  const colors = labels.map(l => WETHER_PALETTE[l] || '#ccc');
  const total = data.values.reduce((a,b)=>a+(Number(b)||0),0);

  const chart = new Chart(canvas, {
    type: 'doughnut',
    data: { labels, datasets: [{ data: data.values, backgroundColor: colors, borderWidth: 0 }] },
    options: {
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const v = ctx.raw || 0;
              const pct = total ? (v/total*100).toFixed(1)+'%' : '0%';
              return `${ctx.label}: ${v} (${pct})`;
            }
          }
        }
      }
    }
  });

  // Build legend
  legendEl.innerHTML = '';
  labels.forEach((label, i) => {
    const value = data.values[i] || 0;
    const pct = total ? ((value/total)*100).toFixed(1) : '0.0';
    const row = document.createElement('div');
    row.className = 'gc-legend-row';
    row.innerHTML = `
      <div class="gc-swatch" style="background:${colors[i]}"></div>
      <div class="gc-legend-label">${label}</div>
      <div style="margin-left:auto;font-weight:600">${value} <span style="color:#6b7280;font-weight:500">(${pct}%)</span></div>
    `;
    legendEl.appendChild(row);
  });

  // Top label
  let topIdx = data.values.indexOf(Math.max(...data.values));
  if (topIdx >= 0 && total > 0) {
    toplabel.querySelector('.large').textContent = `${labels[topIdx]} — ${Math.round((data.values[topIdx]/total)*100)}%`;
    toplabel.querySelector('.small').textContent = 'dominant emotion';
  }

  // Export
  exportBtn.addEventListener('click', ()=>{
    const url = chart.toBase64Image();
    const a = document.createElement('a');
    a.href = url;
    a.download = (opts.filename || 'global-emotion-chart') + '.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
  });

  return {
    chart,
    update(newData){
      chart.data.labels = newData.labels;
      chart.data.datasets[0].data = newData.values;
      chart.data.datasets[0].backgroundColor = newData.labels.map(l => WETHER_PALETTE[l] || '#ccc');
      chart.update();
    },
    destroy(){ chart.destroy(); container.removeChild(card); }
  };
}

function initGlobalChartFromDOM(selector){
  const wrapper = document.querySelector(selector);
  const dataAttr = wrapper.getAttribute('data-emotions');
  const parsed = JSON.parse(dataAttr);
  return createGlobalChart(wrapper, parsed || {labels:[], values:[]});
}
