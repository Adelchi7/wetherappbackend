import './pollComponents.js';

// Containers
const container = document.getElementById('poll-card-container');
const nextBtn = document.getElementById('nextBtn');
const resultsSlide = document.getElementById('poll-results');

let polls = [];
let currentIndex = 0;

// Fetch active polls
async function loadPolls() {
  try {
    const res = await fetch('/api/polls/active');
    polls = await res.json();
    if (polls.length === 0) {
      container.innerHTML = '<p>No active polls.</p>';
      return;
    }
    renderPoll(currentIndex);
  } catch (err) {
    console.error('Failed to load polls:', err);
    container.innerHTML = '<p>Error loading polls.</p>';
  }
}

// Render a single poll
function renderPoll(index) {
  container.innerHTML = '';
  resultsSlide.innerHTML = '';
  resultsSlide.classList.remove('active');

  const poll = polls[index];
  const el = document.createElement('poll-question');
  el.setAttribute('question', poll.questionText);
  el.setAttribute('options', JSON.stringify(poll.options));
  el.setAttribute('question-id', poll._id);

  // Listen for poll submission
  el.addEventListener('poll-voted', async (event) => {
    const questionId = poll._id;

    try {
      // Fetch poll results from backend
      const res = await fetch(`/api/polls/pollResults?questionId=${questionId}`);
      const results = await res.json();

      // Show results slide
      showResultsSlide(results);
    } catch (err) {
      console.error('Failed to fetch poll results:', err);
    }
  });

  container.appendChild(el);
  nextBtn.disabled = true; // disable Next until results shown
}

// Show results slide
function showResultsSlide(results) {
  resultsSlide.innerHTML = `
    <h3>Results</h3>
    <ul>
      ${results.map(r => `<li>${r.option}: ${r.votes} votes</li>`).join('')}
    </ul>
  `;
  resultsSlide.classList.add('active');

  // Enable Next button after results are shown
  nextBtn.disabled = false;
}

// Next button click
nextBtn.addEventListener('click', () => {
  if (currentIndex < polls.length - 1) {
    currentIndex++;
    renderPoll(currentIndex);
  } else {
    container.innerHTML = '<p>✅ You have completed all polls!</p>';
    resultsSlide.innerHTML = '';
    nextBtn.style.display = 'none';
  }
});

// Initial load
loadPolls();

// -------------------- Hide overlay after full load --------------------
window.addEventListener("load", () => {
  const overlay = document.getElementById("loading-overlay");
  if (overlay) {
    overlay.classList.add("hidden");
    setTimeout(() => overlay.style.display = "none", 400);
  }
});
