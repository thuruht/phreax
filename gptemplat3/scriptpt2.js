document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  const passwordInput = document.getElementById("password");
  const terminal = document.getElementById("terminal");

  // Helper: append output line with glitch styling
  function appendLine(text, type = "system") {
    const line = document.createElement("div");
    line.classList.add("output-line", type);
    line.setAttribute("data-text", text); // for glitch effect
    line.textContent = text;
    terminal.appendChild(line);

    // Auto scroll
    terminal.scrollTop = terminal.scrollHeight;
  }

  // Initial boot line
  appendLine("[System] Awaiting input...");

  // Fake login handler
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const password = passwordInput.value.trim();

    if (!password) {
      appendLine("[Error] No access key entered.", "error");
      return;
    }

    // Send to backend
    fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ password }),
      headers: { "Content-Type": "application/json" },
      credentials: "include"
    })
      .then((res) => {
        if (res.ok) {
          appendLine("[System] Access granted. Welcome, Phreaker.");
          form.style.display = "none"; // hide login form
        } else {
          appendLine("[Error] Access denied. Invalid key.", "error");
        }
      })
      .catch(() => {
        appendLine("[Error] Connection failed.", "error");
      });

    passwordInput.value = "";
  });

  // Example: simulate some async system messages
  setTimeout(() => appendLine("[System] Boot sequence complete."), 2000);
  setTimeout(() => appendLine("[System] Listening for commands..."), 4000);
});
