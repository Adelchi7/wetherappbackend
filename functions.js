

// functions.js

async function chooseColor(color) {
  // Get public IP from ipify
  let ip = "unknown";
  try {
    const ipRes = await fetch("https://api.ipify.org?format=json");
    const ipData = await ipRes.json();
    ip = ipData.ip;
  } catch (e) {
    console.warn("Could not fetch IP", e);
  }

  // Build visitor info
  const visitorInfo = {
    ip,
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

  const data = await res.json();
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

window.chooseColor = chooseColor;
window.submitInput = submitInput;

