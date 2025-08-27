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
  // Step 1: Try to get GPS coordinates
  let coords = null;
  try {
    coords = await getCoordinates();
  } catch (err) {
    console.warn("Geolocation failed, falling back to IP", err);
  }

  // Step 2: If no coordinates, get public IP
  let ip = "unknown";
  if (!coords) {
    try {
      const ipRes = await fetch("https://api.ipify.org?format=json");
      const ipData = await ipRes.json();
      ip = ipData.ip;
    } catch (e) {
      console.warn("Could not fetch IP", e);
    }
  }

  // Step 3: Build visitor info
  const visitorInfo = {
    ip,
    coords, // may be null if IP fallback
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform
  };

  // Send to backend
  const res = await fetch("/api/choice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ color, visitorInfo })
  });

  // Parse JSON safely, fallback to default if backend fails
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
