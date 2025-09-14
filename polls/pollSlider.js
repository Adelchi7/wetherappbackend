import './pollComponents.js';

// Containers
const container = document.getElementById('poll-card-container');
const nextBtn = document.getElementById('nextBtn');
const resultsSlide = document.getElementById('poll-results');

let polls = [];
let currentIndex = 0;

// Fetch active polls
async function loadPolls() {
  showLoading("Loading polls...");
  try {
    const res = await fetch('/api/polls/active');
    polls = await res.json();
    if (polls.length === 0) {
      container.innerHTML = '<p>No active polls.</p>';
      hideLoading();
      return;
    }
    renderPoll(currentIndex);
  } catch (err) {
    console.error('Failed to load polls:', err);
    container.innerHTML = '<p>Error loading polls.</p>';
    hideLoading();
  }
}


// Render a single poll
// Render a single poll
function renderPoll(index) {
  showLoading("Loading question...");

  container.innerHTML = '';
  resultsSlide.innerHTML = '';
  resultsSlide.classList.remove('active');

  const poll = polls[index];
  const el = document.createElement('poll-question');
  el.setAttribute('question', poll.questionText);
  el.setAttribute('options', JSON.stringify(poll.options));
  el.setAttribute('question-id', poll._id);

  container.appendChild(el);

  // ✅ Attach event listeners AFTER el is created
  el.addEventListener("poll-rendered", () => {
    hideLoading();
  });

  el.addEventListener('poll-voted', async () => {
    const res = await fetch(`/api/polls/pollResults?questionId=${poll._id}`);
    const results = await res.json();
    showResultsSlide(results);
  });

  nextBtn.disabled = true;

  // fallback hide in case poll-rendered never fires
  requestAnimationFrame(() => {
    setTimeout(() => hideLoading(), 500);
  });
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

function showLoading(message = "Loading...") {
  const loader = document.getElementById("polls-loader");
  if (loader) {
    loader.querySelector(".loading-message").textContent = message;
    loader.style.display = "flex";
    setTimeout(() => loader.classList.remove("hidden"), 10);
  }
}

function hideLoading() {
  const loader = document.getElementById("polls-loader");
  if (loader) {
    loader.classList.add("hidden");
    setTimeout(() => loader.style.display = "none", 300);
  }
}


// -------------------- Hide overlay after full load --------------------
window.addEventListener("load", () => {
  const overlay = document.getElementById("loading-overlay");
  if (overlay) {
    overlay.classList.add("hidden");
    setTimeout(() => overlay.style.display = "none", 400);
  }
});
