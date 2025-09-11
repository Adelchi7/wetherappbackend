import './pollComponents.js';

const container = document.getElementById('poll-card-container');
const nextBtn = document.getElementById('nextBtn');

let polls = [];
let currentIndex = 0;

// Fetch polls
async function loadPolls() {
  const res = await fetch('/api/polls/active');
  polls = await res.json();
  if (polls.length === 0) {
    container.innerHTML = '<p>No active polls.</p>';
    return;
  }
  renderPoll(currentIndex);
}

function renderPoll(index) {
  container.innerHTML = '';
  const poll = polls[index];
  const el = document.createElement('poll-question');
  el.setAttribute('question', poll.questionText);
  el.setAttribute('options', JSON.stringify(poll.options));
  el.setAttribute('question-id', poll._id);

  // Listen for vote event
  el.addEventListener('poll-voted', () => {
    nextBtn.disabled = false; // enable next button
  });

  container.appendChild(el);
  nextBtn.disabled = true;
}

// Next button click
nextBtn.addEventListener('click', () => {
  if (currentIndex < polls.length - 1) {
    currentIndex++;
    renderPoll(currentIndex);
  } else {
    container.innerHTML = '<p>✅ You have completed all polls!</p>';
    nextBtn.style.display = 'none';
  }
});

// Initial load
loadPolls();
