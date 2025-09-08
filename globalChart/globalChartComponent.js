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

  let chart;

  if (opts.event) {
    // Historical event line chart
    const labels = data.labels;
    const values = data.values;
    chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: opts.event.title || 'Visitors',
          data: values,
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76,175,80,0.2)',
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.dataset.label}: ${ctx.raw}`
            }
          },
          annotation: {
            annotations: opts.event ? [{
              type: 'box',
              xMin: labels[0],
              xMax: labels[labels.length - 1],
              backgroundColor: 'rgba(255, 99, 132, 0.1)',
              label: { content: opts.event.title || '', enabled: true }
            }] : []
          }
        },
        scales: { y: { beginAtZero: true } }
      }
    });

    legendEl.innerHTML = '';
    toplabel.style.display = 'none'; // hide top label for line chart

  } else {
    // Doughnut chart (existing logic)
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

    // Top label
    let topIdx = data.values.indexOf(Math.max(...data.values));
    if (topIdx>=0 && total>0) {
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

function initGlobalChartFromDOM(selector){
  const wrapper = document.querySelector(selector);
  const dataAttr = wrapper.getAttribute('data-emotions');
  const parsed = JSON.parse(dataAttr);
  return createGlobalChart(wrapper, parsed || {labels:[], values:[]});
}

// Fetch visitor data for a given event
/* async function fetchVisitorsForEvent(start, end) {
  const res = await fetch('globalChart/mockVisitors.json');
  const data = await res.json();

  const startDate = new Date(start);
  const endDate = new Date(end);
  return data.filter(v => {
    const d = new Date(v.createdAt);
    return !isNaN(d) && d >= startDate && d <= endDate;
  });
} */

// Fetch events from API
async function fetchEvents() {
  try {
    const res = await fetch("/api/events");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Failed to fetch events:", err);
    return [];
  }
}


/* async function fetchVisitorsForEvent(start, end) {
  const res = await fetch(`/api/visitors/historical?start=${start}&end=${end}`);
  return await res.json();
} */


// Aggregate visitors by day
function aggregateVisitorsByDay(visitors){
  const counts = {};
  visitors.forEach(v=>{
    const day = new Date(v.createdAt).toISOString().slice(0,10);
    counts[day]=(counts[day]||0)+1;
  });
  const labels = Object.keys(counts).sort();
  const values = labels.map(d=>counts[d]);
  return {labels,values};
}

async function fetchVisitorsForEvent(start, end) {
  const res = await fetch("/globalChart/mockVisitors.json"); // or /mockVisitors.json if moved to public
  const data = await res.json();
  const startDate = new Date(start);
  const endDate = new Date(end);
  return data.filter(v => {
    const created = new Date(v.createdAt);
    return created >= startDate && created <= endDate;
  });
}


// Create historical chart
async function createHistoricalEventChart(container) {
  try {
    const eventData = JSON.parse(container.dataset.event);

    // fetch visitor data in the date range of THIS chart's event
    const visitors = await fetchVisitorsForEvent(eventData.start, eventData.end);
    const { labels, values } = aggregateVisitorsByDay(visitors);

    // create the base chart (line chart because opts.event is passed)
    const chartWrapper = createGlobalChart(
      container,
      { labels, values },
      { event: eventData, filename: `${eventData.title}-chart` }
    );

    // 🔽 fetch all events for annotations
    let events = [];
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      if (Array.isArray(data)) {
        events = data;
      } else {
        console.warn("Events API did not return an array:", data);
      }
    } catch (err) {
      console.error("Failed to fetch events:", err);
    }

    // make sure annotation plugin config exists
    chartWrapper.chart.options.plugins.annotation = chartWrapper.chart.options.plugins.annotation || { annotations: {} };

    // add each event as a shaded box if any
    events.forEach(ev => {
      if (ev && ev.title && ev.start && ev.end) {
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

  } catch (e) {
    console.error("Error creating historical chart:", e);
  }
}

// Initialize all historical charts
(async () => {
  const containers = document.querySelectorAll('[data-event]');
  for (const c of containers) {
    await createHistoricalEventChart(c);
  }
})();

