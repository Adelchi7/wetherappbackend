const API_BASE = '/api/polls'; // adjust if needed

// -------------------- <poll-question> --------------------
class PollQuestion extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const questionText = this.getAttribute('question') || 'No question';
    const options = JSON.parse(this.getAttribute('options') || '[]');

    this.shadowRoot.innerHTML = `
      <style>
        .poll-card { border: 1px solid #ccc; padding: 1em; margin: 1em 0; border-radius: 8px; }
        button { margin-top: 0.5em; }
      </style>
      <div class="poll-card">
        <p>${questionText}</p>
        ${options.map((opt, i) => `
          <label>
            <input type="radio" name="poll-${this.id}" value="${opt}"> ${opt}
          </label><br>
        `).join('')}
        <button>Submit</button>
        <p class="status"></p>
      </div>
    `;

    this.shadowRoot.querySelector('button').addEventListener('click', () => this.submit());
  }

  async submit() {
    const selected = Array.from(this.shadowRoot.querySelectorAll('input[type=radio]'))
      .find(input => input.checked)?.value;

    const status = this.shadowRoot.querySelector('.status');
    if (!selected) {
      status.textContent = 'Please select an option!';
      return;
    }

    // POST to backend
    try {
      const response = await fetch(`${API_BASE}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: this.getAttribute('question-id'),
          visitorId: localStorage.getItem('visitorId') || null,
          selectedOption: selected
        })
      });
      if (response.ok) {
        status.textContent = '✅ Thank you for voting!';
          // Notify parent container that this poll has been answered
        this.dispatchEvent(new CustomEvent('poll-voted', { bubbles: true }));
      } else {
        status.textContent = '❌ Submission failed.';
      }
    } catch (err) {
      status.textContent = '❌ Network error.';
    }
  }
}

customElements.define('poll-question', PollQuestion);


// -------------------- Load Questions --------------------
async function loadPolls() {
  const container = document.getElementById('poll-container');
  try {
    const res = await fetch(`${API_BASE}/active`);
    const questions = await res.json();
    questions.forEach(q => {
      const el = document.createElement('poll-question');
      el.setAttribute('question', q.questionText);
      el.setAttribute('options', JSON.stringify(q.options));
      el.setAttribute('question-id', q._id);
      container.appendChild(el);
    });
  } catch (err) {
    container.innerHTML = '<p>Failed to load polls.</p>';
  }
}

// Load polls on page load
window.addEventListener('DOMContentLoaded', loadPolls);
