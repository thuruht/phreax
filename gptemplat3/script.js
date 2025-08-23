// src/script.js

// === API helper ===
async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    credentials: "include" // include cookies for session auth
  });

  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const data = await res.json();
      if (data.error) msg = data.error;
    } catch (_) {}
    throw new Error(msg);
  }

  return res.json();
}

// === Auth ===
async function handleLogin(e) {
  e.preventDefault();
  const password = document.querySelector("#password").value;

  try {
    await apiFetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    await loadContacts();
    document.querySelector("#login-section").style.display = "none";
    document.querySelector("#app-section").style.display = "block";
  } catch (err) {
    alert("Login failed: " + err.message);
  }
}

async function handleLogout() {
  try {
    await apiFetch("/api/logout", { method: "POST" });
  } catch (_) {
    // ignore logout error
  }
  document.querySelector("#login-section").style.display = "block";
  document.querySelector("#app-section").style.display = "none";
}

// === Contacts ===
async function loadContacts() {
  const listEl = document.querySelector("#contacts-list");
  listEl.innerHTML = "<li>Loading...</li>";

  try {
    const contacts = await apiFetch("/api/contacts");
    if (!Array.isArray(contacts)) throw new Error("Invalid response");
    listEl.innerHTML = "";
    contacts.forEach((c) => {
      const li = document.createElement("li");
      li.textContent = `${c.name} — ${c.phone}`;
      listEl.appendChild(li);
    });
  } catch (err) {
    listEl.innerHTML = `<li class="error">Failed to load: ${err.message}</li>`;
  }
}

async function addContact(e) {
  e.preventDefault();
  const name = document.querySelector("#new-name").value;
  const phone = document.querySelector("#new-phone").value;

  try {
    await apiFetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone })
    });
    await loadContacts();
  } catch (err) {
    alert("Add failed: " + err.message);
  }
}

// === Images ===
async function uploadImage(e) {
  e.preventDefault();
  const fileInput = document.querySelector("#image-file");
  if (!fileInput.files.length) return alert("No file chosen");

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  try {
    const data = await apiFetch("/api/images/upload", {
      method: "POST",
      body: formData
    });
    alert("Uploaded: " + data.url);
  } catch (err) {
    alert("Upload failed: " + err.message);
  }
}

async function loadImages() {
  const listEl = document.querySelector("#images-list");
  listEl.innerHTML = "<li>Loading...</li>";

  try {
    const images = await apiFetch("/api/images");
    listEl.innerHTML = "";
    images.forEach((key) => {
      const li = document.createElement("li");
      const img = document.createElement("img");
      img.src = `/api/images/${key}`;
      img.alt = key;
      img.width = 100;
      li.appendChild(img);
      listEl.appendChild(li);
    });
  } catch (err) {
    listEl.innerHTML = `<li class="error">Failed to load images: ${err.message}</li>`;
  }
}

// === Bind UI ===
document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#login-form")?.addEventListener("submit", handleLogin);
  document.querySelector("#logout-btn")?.addEventListener("click", handleLogout);
  document.querySelector("#add-contact-form")?.addEventListener("submit", addContact);
  document.querySelector("#upload-form")?.addEventListener("submit", uploadImage);

  // Auto-check session by trying contacts
  loadContacts().then(() => {
    document.querySelector("#login-section").style.display = "none";
    document.querySelector("#app-section").style.display = "block";
  }).catch(() => {
    document.querySelector("#login-section").style.display = "block";
    document.querySelector("#app-section").style.display = "none";
  });
});
