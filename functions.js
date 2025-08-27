// functions.js
const { color, visitorInfo } = req.body;
const ip = visitorInfo?.ip || req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

async function chooseColor(color) {
  const resultDiv = document.getElementById("result");
  resultDiv.textContent = "Processing...";

  try {
    // Get public IP
    const ipRes = await fetch("https://api.ipify.org?format=json");
    const ipData = await ipRes.json();
    const ip = ipData.ip;

    // Collect browser info
    const visitorInfo = {
      ip,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookiesEnabled: navigator.cookieEnabled,
      localStorageAvailable: typeof localStorage !== "undefined",
      sessionStorageAvailable: typeof sessionStorage !== "undefined",
      indexedDBAvailable: typeof indexedDB !== "undefined"
    };

    // Send color choice + visitor info to backend
    const res = await fetch("/api/choice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ color, visitorInfo })
    });

    const data = await res.json();

    // Show result
    resultDiv.innerHTML =
      `You chose <b style="color:${data.color}">${data.color}</b><br>` +
      `Location: ${data.location || "unknown"}`;

  } catch (err) {
    console.error("Error:", err);
    resultDiv.textContent = "Failed to process your choice.";
  }
}

// Expose globally for button onclick
window.chooseColor = chooseColor;


async function submitInput(data) {
  await fetch("/api/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
}

// expose globally so onclick etc. works
window.submitInput = submitInput;
