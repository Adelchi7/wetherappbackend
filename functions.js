// functions.js

// Helper: get coordinates from browser
async function getCoordinates() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject("Geolocation not supported");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        reject(error.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

async function chooseColor(color) {
  let coords = null;
  let ip = null;

  // 1️⃣ Try browser geolocation first
  try {
    coords = await getCoordinates(); // returns { latitude, longitude }
  } catch (err) {
    console.warn("Geolocation failed, falling back to IP:", err);

    // 2️⃣ If denied, fetch public IP
    try {
      const ipRes = await fetch("https://api.ipify.org?format=json");
      const ipData = await ipRes.json();
      ip = ipData.ip;
    } catch (e) {
      console.warn("Could not fetch IP", e);
      ip = "unknown";
    }
  }

  // 3️⃣ Build visitor info
  const visitorInfo = {
    coords,   // may be null
    ip,       // only set if geolocation denied
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform
  };

  // 4️⃣ Send to backend
  const res = await fetch("/api/choice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ color, visitorInfo })
  });

  // 5️⃣ Safely parse JSON
  const data = await res.json().catch(() => ({ color, location: "Unknown" }));

  document.getElementById("result").innerHTML =
    `You chose <b style="color:${data.color}">${data.color}</b><br>` +
    `Location: ${data.location}`;
}

async function submitInput(data) {
  await fetch("/api/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
}

// Expose globally for onclick handlers
window.chooseColor = chooseColor;
window.submitInput = submitInput;
