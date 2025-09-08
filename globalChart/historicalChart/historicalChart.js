class HistoricalEventChart extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }); // Step 2a: attach shadow DOM
  }

  connectedCallback() {
    // Step 2b: runs when element is added to the DOM
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '300px';
    container.style.border = '1px solid #ccc'; // temporary visual border
    this.shadowRoot.appendChild(container);

    container.textContent = "Chart will appear here"; // placeholder
  }
}

// Step 2c: define the element
customElements.define('historical-event-chart', HistoricalEventChart);
