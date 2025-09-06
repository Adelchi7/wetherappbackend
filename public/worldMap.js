async function loadWorldMap() {
  const res = await fetch("/api/visitors");
  const visitors = await res.json();
  if (!visitors.length) return;

  console.log("World map visitors:", visitors);

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

  // --- initialize map (world view) ---
  const map = L.map("visitorMap").setView([20, 0], 2); // global center
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      map.setView([latitude, longitude], 7); // local zoom
    },
    (err) => {
      console.warn("Geolocation denied or failed:", err.message);
      // stays on default world view
    }
  );

  // --- prepare heatmap points ---
  const heatPoints = visitors.map(v => {
    const [lon, lat] = v.location.coordinates; // MongoDB: [lon, lat]
    const snappedLat = patchLat(lat, targetKm);
    const snappedLon = patchLon(lon, lat, targetKm);
    return [snappedLat, snappedLon, 1]; // always [lat, lon, intensity]
  });

  // --- render fuzzy dots ---
  heatPoints.forEach(([lat, lon], index) => {
    const color = (visitors[index].color || "#999").toLowerCase();

    const marker = L.circleMarker([lat, lon], {
      radius: 12,
      color: color,
      fillColor: color,
      fillOpacity: 0.4,
      weight: 0
    }).addTo(map);

    const el = marker.getElement();
    if (el) {
      el.style.filter = "blur(4px)";
      el.style.opacity = "0.6";
      el.style.transformOrigin = "center center"; // keep pulse centered
    }

    // --- highlight the newest visitor ---
    if (index === visitors.length - 1) {
      const marker = L.circleMarker([lat, lon], {
        radius: 18,
        color: "#FFD700",
        fillColor: "#FFD700",
        fillOpacity: 0.9,
        weight: 2
      }).addTo(map);

      let growing = true;
      setInterval(() => {
        let r = marker.getRadius();
        if (growing) {
          r += 0.5;
          if (r >= 22) growing = false;
        } else {
          r -= 0.5;
          if (r <= 18) growing = true;
        }
        marker.setRadius(r);
      }, 50);

      marker.bindPopup(
        `<b>New visitor!</b><br/>Emotion: ${visitors[index].emotion || "Unknown"}`
      ).openPopup();

      map.panTo([lat, lon]);
    }
  });

  // --- add heatmap layer ---
  L.heatLayer(heatPoints, { radius: 50, blur: 25, maxZoom: 17 }).addTo(map);
}

loadWorldMap();
