const WETHER_PALETTE = {
  'Hopeful': '#4CAF50',
  'Angry': '#F44336',
  'Sad': '#2196F3',
  'Neutral': '#9E9E9E',
  'Anxious': '#FFC107'
};

// ---------------------------
// 1. Create a generic chart
// ---------------------------
function createGlobalChart(container, data, opts = {}) {
  const tpl = document.getElementById('global-chart-template');
  const node = tpl.content.cloneNode(true);
  container.appendChild(node);

  const card = container.querySelector('.gc-card:last-child');
  const canvas = card.querySelector('canvas');
  const legendEl = card.querySelector('.gc-legend');
  const toplabel = card.querySelector('.gc-toplabel');
  const exportBtn = card.querySelector('.gc-export-btn');

  let chart;

  if (opts.event) {
    // ---------------------------
    // Line chart for historical event
    // ---------------------------
    chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [{
          label: opts.event.title || 'Visitors',
          data: data.values,
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76,175,80,0.2)',
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            type: 'time',
            time: { parser: 'YYYY-MM-DD', unit: 'day', tooltipFormat: 'YYYY-MM-DD' },
            title: { display: true, text: 'Date' }
          },
          y: { beginAtZero: true }
        },
        plugins: {
          legend: { display: true },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.dataset.label}: ${ctx.raw}`
            }
          },
          annotation: {
            annotations: {}
          }
        }
      }
    });

    legendEl.innerHTML = '';
    toplabel.style.display = 'none';

  } else {
    // ---------------------------
    // Doughnut chart for emotions
    // ---------------------------
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

    chart = new Chart(canvas, {
      type: 'doughnut',
      data: { labels, datasets: [{ data: data.values, backgroundColor: colors, borderWidth: 0 }] },
      options: {
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => {
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
    labels.forEach((label,i)=>{
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

    let topIdx = data.values.indexOf(Math.max(...data.values));
    if (topIdx >= 0 && total > 0) {
      toplabel.querySelector('.large').textContent = `${labels[topIdx]} — ${Math.round((data.values[topIdx]/total)*100)}%`;
      toplabel.querySelector('.small').textContent = 'dominant emotion';
    }
  }

  // Export
  exportBtn.addEventListener('click', ()=>{
    const url = chart.toBase64Image();
    const a = document.createElement('a');
    a.href = url;
    a.download = (opts.filename || 'global-emotion-chart')+'.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
  });

  return {
    chart,
    update(newData){
      if(chart.config.type==='doughnut'){
        chart.data.labels = newData.labels;
        chart.data.datasets[0].data = newData.values;
        chart.data.datasets[0].backgroundColor = newData.labels.map(l => WETHER_PALETTE[l]||'#ccc');
      } else {
        chart.data.labels = newData.labels;
        chart.data.datasets[0].data = newData.values;
      }
      chart.update();
    },
    destroy(){ chart.destroy(); container.removeChild(card); }
  };
}

// ---------------------------
// 2. Create historical event chart
// ---------------------------
async function createHistoricalEventChart(container) {
  try {
    const eventData = JSON.parse(container.dataset.event);

    // Fetch visitor data
    const visitors = await fetchVisitorsForEvent(eventData.start, eventData.end);
    const { labels, values } = aggregateVisitorsByDay(visitors);

    // Create chart
    const chartWrapper = createGlobalChart(container, { labels, values }, { event: eventData, filename: `${eventData.title}-chart` });

    // Fetch other events
    let events = await fetchEvents();
    events = events.filter(ev => ev.title !== eventData.title);

    // Add box annotations safely
    chartWrapper.chart.options.plugins.annotation.annotations = chartWrapper.chart.options.plugins.annotation.annotations || {};
    events.forEach(ev => {
      if(ev && ev.title && ev.start && ev.end){
        chartWrapper.chart.options.plugins.annotation.annotations[ev.title] = {
          type: "box",
          xMin: ev.start,
          xMax: ev.end,
          backgroundColor: "rgba(255,99,132,0.1)",
          label: { content: ev.title, enabled: true, position: "start" }
        };
      }
    });

    chartWrapper.chart.update();
    return chartWrapper;

  } catch(e) {
    console.error("Error creating historical chart:", e);
  }
}

// ---------------------------
// Initialize all historical charts
// ---------------------------
(async () => {
  const containers = document.querySelectorAll('[data-event]');
  for(const c of containers){
    await createHistoricalEventChart(c);
  }
})();
