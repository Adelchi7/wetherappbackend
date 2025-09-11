// Placeholder image data URIs (simple SVGs) — replace with your own assets
const svg = (emoji, bg) => 
  'data:image/svg+xml;utf8,' + encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'>
      <defs>
        <linearGradient id='g' x1='0' x2='1'>
          <stop offset='0' stop-color='${bg}' stop-opacity='0.9' />
          <stop offset='1' stop-color='${bg}' stop-opacity='0.6' />
        </linearGradient>
      </defs>
      <rect width='400' height='300' rx='24' fill='url(#g)'/>
      <text x='50%' y='54%' dominant-baseline='middle' text-anchor='middle' font-size='120'>${emoji}</text>
    </svg>
  `);

const assets = {
  hopeful: {
    q1:{img:svg('🌅','#4CAF50'),label:'Clear sunrise sky'},
    q2:{img:svg('🏞️','#4CAF50'),label:'Calm river flowing'},
    q3:{img:svg('🎼','#4CAF50'),label:'Soft flute'},
    q4:{img:svg('🌿','#4CAF50'),label:'Green field in spring'},
    q5:{img:svg('🌀','#4CAF50'),label:'Rising spiral'},
    color:'var(--green)', emoji:'🌱', title:'Hopeful / Optimistic'
  },
  angry: {
    q1:{img:svg('☀️','#F44336'),label:'Blazing hot sun'},
    q2:{img:svg('🏃‍♂️','#F44336'),label:'Running uphill'},
    q3:{img:svg('🥁','#F44336'),label:'Pounding drum'},
    q4:{img:svg('🌋','#F44336'),label:'Volcano erupting'},
    q5:{img:svg('🔺','#F44336'),label:'Sharp triangle'},
    color:'var(--red)', emoji:'🔥', title:'Angry / Frustrated'
  },
  sad: {
    q1:{img:svg('🌧️','#2196F3'),label:'Rain falling'},
    q2:{img:svg('🧘🏼','#2196F3'),label:'Sitting still'},
    q3:{img:svg('🎻','#2196F3'),label:'Lone cello'},
    q4:{img:svg('🌳','#2196F3'),label:'Weeping willow'},
    q5:{img:svg('💧','#2196F3'),label:'Drooping teardrop'},
    color:'var(--blue)', emoji:'💧', title:'Sad / Grieving'
  },
  neutral: {
    q1:{img:svg('☁️','#9E9E9E'),label:'Overcast sky'},
    q2:{img:svg('🛣️','#9E9E9E'),label:'Straight empty road'},
    q3:{img:svg('⏱️','#9E9E9E'),label:'Steady metronome'},
    q4:{img:svg('🏜️','#9E9E9E'),label:'Flat plain'},
    q5:{img:svg('➖','#9E9E9E'),label:'Flat line'},
    color:'var(--gray)', emoji:'⚪', title:'Neutral / Indifferent'
  },
  anxious: {
    q1:{img:svg('⛈️','#FFC107'),label:'Thunderstorm'},
    q2:{img:svg('🚗','#FFC107'),label:'Busy highway'},
    q3:{img:svg('🎻','#FFC107'),label:'Buzzing string'},
    q4:{img:svg('🌊','#FFC107'),label:'Stormy ocean'},
    q5:{img:svg('⚡','#FFC107'),label:'Jagged zig-zag'},
    color:'var(--yellow)', emoji:'⚡', title:'Anxious / Fearful'
  }
};

// Questions
const questions = [
  { id:'q1', title:'If today’s weather matched you, it would be…' },
  { id:'q2', title:'Which pace matches your mood right now?' },
  { id:'q3', title:'If your body was an instrument today, it would be…' },
  { id:'q4', title:'The world around you feels like…' },
  { id:'q5', title:'If you were a shape right now, you’d be…' }
];

// Build options per question
function buildOptions(qid){
  return [
    { emotion:'hopeful',  ...assets.hopeful[qid]  },
    { emotion:'angry',    ...assets.angry[qid]    },
    { emotion:'sad',      ...assets.sad[qid]      },
    { emotion:'neutral',  ...assets.neutral[qid]  },
    { emotion:'anxious',  ...assets.anxious[qid]  },
  ];
}

// State
let current = 0;
const scores = { hopeful:0, angry:0, sad:0, neutral:0, anxious:0 };
const answers = [null, null, null, null, null];

// Elements
const intro = document.getElementById('intro');
const quiz = document.getElementById('quiz');
const qwrap = document.getElementById('qwrap');
const qcount = document.getElementById('qcount');
const bar = document.getElementById('bar');
const nextBtn = document.getElementById('nextBtn');
const backBtn = document.getElementById('backBtn');
const restartBtn = document.getElementById('restartBtn');
const result = document.getElementById('result');
const storeBtn = document.getElementById('storeBtn');
const againBtn = document.getElementById('againBtn');
const finalBadge = document.getElementById('finalBadge');

// Render a question
function renderQuestion(){
  const q = questions[current];
  const opts = buildOptions(q.id);
  qwrap.innerHTML = `
    <div class="question-title">${q.title}</div>
    <div class="subtitle">Choose one picture that feels right.</div>
    <div class="grid">
      ${opts.map((o,idx)=>`
        <button class="choice" data-emotion="${o.emotion}" data-index="${idx}" aria-label="${o.label}">
          <img src="${o.img}" alt="${o.label}"/>
          <div class="label">${o.label}</div>
        </button>
      `).join('')}
    </div>
  `;
  qcount.textContent = `Question ${current+1} of ${questions.length}`;
  bar.style.width = ((current)/questions.length*100)+'%';
  nextBtn.disabled = answers[current] == null;
  backBtn.disabled = current === 0;

  if(answers[current]){
    const selected = [...qwrap.querySelectorAll('.choice')]
      .find(el => el.dataset.emotion === answers[current]);
    if(selected) selected.style.borderColor = 'white';
  }

  qwrap.querySelectorAll('.choice').forEach(el => {
    el.addEventListener('click', () => {
      qwrap.querySelectorAll('.choice').forEach(c => c.style.borderColor = 'rgba(255,255,255,0.12)');
      el.style.borderColor = 'white';
      answers[current] = el.dataset.emotion;
      nextBtn.disabled = false;
    });
  });
}

// Compute final result
function computeResult(){
  scores.hopeful = scores.angry = scores.sad = scores.neutral = scores.anxious = 0;
  answers.forEach(em => { if(em) scores[em] += 1; });
  const entries = Object.entries(scores);
  const maxVal = Math.max(...entries.map(([,v])=>v));
  const tied = entries.filter(([,v])=>v===maxVal).map(([k])=>k);
  return tied[Math.floor(Math.random()*tied.length)];
}

// Show result
function showResult(){
  const final = computeResult();
  const set = assets[final];
  finalBadge.innerHTML = `
    <span class="swatch" style="background:${set.color}"></span>
    <span class="emoji">${set.emoji}</span>
    <span>${set.title}</span>
  `;
  document.documentElement.style.setProperty('--accent', set.color);
  quiz.classList.add('hidden');
  result.style.display = 'block';
  bar.style.width = '100%';
  restartBtn.style.display = 'inline-block';
}

// Reset quiz
function resetAll(){
  current = 0;
  for (const k in scores) scores[k]=0;
  answers.fill(null);
  result.style.display='none';
  intro.style.display='block';
  quiz.classList.add('hidden');
  restartBtn.style.display='none';
  bar.style.width = '0%';
}

// Navigation
document.getElementById('startBtn').addEventListener('click', () => {
  intro.style.display='none';
  quiz.classList.remove('hidden');
  renderQuestion();
});

nextBtn.addEventListener('click', () => {
  if(current < questions.length-1){
    current += 1;
    renderQuestion();
  } else {
    showResult();
  }
});

backBtn.addEventListener('click', () => {
  if(current > 0){
    current -= 1;
    renderQuestion();
  }
});

againBtn.addEventListener('click', resetAll);
restartBtn.addEventListener('click', resetAll);

async function getVisitorInfo() {
  let coords = null;
  let ip = null;

  try {
    coords = await new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject("No geolocation");
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        err => reject(err.message),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  } catch (err) {
    console.warn("Geolocation failed:", err);
    try {
      const ipRes = await fetch("https://api.ipify.org?format=json");
      const ipData = await ipRes.json();
      ip = ipData.ip;
    } catch (e) {
      console.warn("IP fetch failed", e);
      ip = "unknown";
    }
  }

  return {
    coords,
    ip,
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    timestamp: new Date().toISOString()
  };
}

storeBtn.addEventListener('click', async () => {
  let currentVisitorId = localStorage.getItem('visitorId');
  finalBadge.textContent = "Saving…";

  const final = computeResult();
  const set = assets[final];
  const visitorInfo = await getVisitorInfo();

  const payload = {
    visitorId: currentVisitorId,
    emotion: final,
    color: set.color,
    emoji: set.emoji,
    title: set.title,
    answers: answers.map((em,i)=>({questionId: questions[i].id, choice: em, emotion: em})),
    ...visitorInfo
  };

  console.log("Payload:", payload);

  try {
    // Decide which API to call
    const apiRoute = currentVisitorId ? "/api/update" : "/api/submit";
    console.log("API Route:", apiRoute, "Payload:", payload);


    const res = await fetch(apiRoute, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log("✅ Stored successfully:", data);

    // Store _id in localStorage if this was a new visitor
    if (!currentVisitorId) {
      localStorage.setItem('visitorId', data.id);
    }

    finalBadge.textContent = "Saved! 🎉";

  } catch (err) {
    console.error(err);
    finalBadge.textContent = "Failed to save 😞";
  }
});

// Keep backend alive while the user has the page open
const PING_INTERVAL = 4 * 60 * 1000; // 4 minutes

async function pingServer() {
  try {
    await fetch("/ping");
    console.log("Pinged backend to keep awake");
  } catch (err) {
    console.warn("Ping failed:", err);
  }
}

// Start pinging
pingServer();             // initial ping immediately
setInterval(pingServer, PING_INTERVAL);



/* storeBtn.addEventListener('click', async () => {
  finalBadge.textContent = "Saving…";
  const final = computeResult();
  const set = assets[final];

  // Trigger async geolocation + submission but don’t block UI
  (async () => {
    const visitorInfo = await getVisitorInfo();
    const payload = {
      emotion: final,
      color: set.color,
      emoji: set.emoji,
      title: set.title,
      answers: answers.map((em,i)=>({questionId: questions[i].id, choice: em, emotion: em})),
      ...visitorInfo
    };
    console.log("Payload:", payload);
    try {
      const res = await fetch("/api/submit", {
        method:"POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      console.log("✅ Stored successfully:", data);
      finalBadge.textContent = "Saved! 🎉";
    } catch(err){
      console.error(err);
      finalBadge.textContent = "Failed to save 😞";
    }
  })();
}); */



