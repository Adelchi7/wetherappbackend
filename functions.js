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
    coords = await getCoordinates(); // should return { latitude, longitude }
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
    coords: coords
      ? { latitude: coords.latitude, longitude: coords.longitude } // keep raw values
      : null,
    ip, // only set if geolocation denied
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

  // 5️⃣ Handle backend response
  const data = await res.json().catch(() => ({ color, location: "Unknown" }));

  document.getElementById("result").innerHTML =
    `You chose <b style="color:${data.color}">${data.color}</b><br>` +
    `Location: ${data.location}`;
}

async function submitInput(data) {
  try {
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      // Backend returned an error
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to submit data");
    }

    const result = await res.json();
    console.log("✅ Data submitted successfully:", result);
    return result;

  } catch (err) {
    console.error("❌ Submit failed:", err);
    // You can also show an alert or update UI here
    throw err; // rethrow if you want calling code to handle it
  }
}

async function loadVisitorMap() {
  const res = await fetch("/api/visitors");
  const visitors = await res.json();
  const targetKm = 100;

  // Initialize map centered globally
  const map = L.map("visitorMap").setView([20, 0], 2);

  // Add OpenStreetMap tiles
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  const heatPoints = visitors.map(v => {
    const [lon, lat] = v.location.coordinates;
    const snappedLat = patchLat(lat, targetKm);
    const snappedLon = patchLon(lon, lat, targetKm);
    return [snappedLat, snappedLon, 1]; // intensity
  });

  L.heatLayer(heatPoints, { radius: 25, blur: 15, maxZoom: 17 }).addTo(map);


  // Add pins
/*   visitors.forEach(v => {
    const [lon, lat] = v.location.coordinates;
    L.circleMarker([lat, lon], {
      radius: 8,
      fillColor: v.color.toLowerCase(),
      color: "#000",
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    }).addTo(map)
      .bindPopup(`Color: ${v.color}`);
  }); */
}

loadVisitorMap();



// Expose globally for onclick handlers
window.chooseColor = chooseColor;
window.submitInput = submitInput;
