class HistoricalEventChart extends HTMLElement {
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }

  async connectedCallback() {
    // build shadow DOM layout
    this.shadow.innerHTML = `
      <style>
        :host { display:block; border:1px solid #ccc; padding:10px; }
        canvas { width:100%; height:300px; }
      </style>
      <h3>📊 Historical Event Chart</h3>
      <canvas id="chart"></canvas>
    `;

    const ctx = this.shadow.querySelector("#chart");

    try {
      // fetch mock data
      const res = await fetch("/globalChart/historicalChart/mockVisitors.json");
      const data = await res.json();

      // aggregate by day
      const counts = {};
      data.forEach(entry => {
        counts[entry.date] = (counts[entry.date] || 0) + 1;
      });

      const labels = Object.keys(counts).sort();
      const values = labels.map(d => counts[d]);

      // render chart
      new Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [{
            label: "Visitors per day",
            data: values,
            fill: false,
            borderColor: "blue",
            tension: 0.2
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: true } }
        }
      });
    } catch (err) {
      console.error("Failed to load mock data", err);
      this.shadow.innerHTML += `<p style="color:red">Error loading data</p>`;
    }
  }
}

customElements.define("historical-event-chart", HistoricalEventChart);

