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
  console.log('>>>>>>> visitors', visitors);

  const targetKm = 100;

  // --- patching functions ---
  function patchLat(lat, targetKm) {
    const degLatSize = targetKm / 111;
    return Math.round(lat / degLatSize) * degLatSize;
  }

  function patchLon(lon, lat, targetKm) {
    const degLonSize = targetKm / (111 * Math.cos(lat * Math.PI / 180));
    return Math.round(lon / degLonSize) * degLonSize;
  }

  // --- initialize map near data ---
  const map = L.map("visitorMap").setView([42.35, 13.4], 6); // L’Aquila
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  // --- prepare heatmap points ---
  const heatPoints = visitors.map(v => {
    const [lon, lat] = v.location.coordinates;   // MongoDB: [lon, lat]
    const snappedLat = patchLat(lat, targetKm);
    const snappedLon = patchLon(lon, lat, targetKm);
    return [snappedLat, snappedLon, 1];         // Leaflet: [lat, lon, intensity]
  });

  console.log("Heat Points:", heatPoints);

  heatPoints.forEach(([lat, lon], index) => {
    const color = visitors[index].color.toLowerCase(); // convert to lowercase for CSS
    const radii = [6, 12, 18];
    const opacities = [0.8, 0.5, 0.2];
    radii.forEach((r, i) => {
        L.circleMarker([lat, lon], {
            radius: r,
            color: color,
            fillColor: color,
            fillOpacity: opacities[i],
            weight: 0
        }).addTo(map);
    });
  });
  // --- add heatmap ---
  L.heatLayer(heatPoints, { radius: 50, blur: 25, maxZoom: 17 }).addTo(map);
}

loadVisitorMap();




// Expose globally for onclick handlers
window.chooseColor = chooseColor;
window.submitInput = submitInput;
