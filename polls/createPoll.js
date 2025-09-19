document.getElementById("createPollForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const question = document.getElementById("question").value.trim();
  const options = document.getElementById("options").value
    .split("\n")
    .map(o => o.trim())
    .filter(o => o.length > 0);

  if (!question || options.length < 2) {
    document.getElementById("statusMessage").textContent = "Please enter a question and at least 2 options.";
    return;
  }

  const pollData = { question, options };

  try {
    const response = await fetch("/api/createPoll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pollData),
    });

    const result = await response.json();
    if (result.success) {
      document.getElementById("statusMessage").textContent = "✅ Poll created successfully!";
      document.getElementById("createPollForm").reset();
    } else {
      document.getElementById("statusMessage").textContent = "❌ Failed to create poll.";
    }
  } catch (err) {
    console.error(err);
    document.getElementById("statusMessage").textContent = "⚠ Error submitting poll.";
  }
});
