/**
 * Task Manager — Frontend App
 *
 * This file talks to the AWS API Gateway endpoint.
 * If no API is configured, it falls back to localStorage
 * so the app still works for testing.
 */

// ══════════════════════════════════════════════════════════
// CONFIG — Paste your API Gateway URL here after deploying
// Example: const API_BASE_URL = "https://abc123.execute-api.us-east-1.amazonaws.com";
// ══════════════════════════════════════════════════════════
const API_BASE_URL =
  "Apna Add krlo";

// Build full URL — if API_BASE_URL is empty, use relative paths (localStorage mode)
const apiUrl = (path) => (API_BASE_URL ? API_BASE_URL + path : path);

// ── State ─────────────────────────────────────────────────
let tasks = [];
let currentFilter = "all";

// ── DOM References ────────────────────────────────────────
const form = document.getElementById("task-form");
const titleInput = document.getElementById("task-title");
const descInput = document.getElementById("task-desc");
const listEl = document.getElementById("task-list");
const statusEl = document.getElementById("status-msg");
const filterBtns = document.querySelectorAll(".filter-btn");

// ══════════════════════════════════════════════════════════
// API HELPERS
// ══════════════════════════════════════════════════════════

async function apiFetch(path, options = {}) {
  const url = apiUrl(path);
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ══════════════════════════════════════════════════════════
// LOAD TASKS
// ══════════════════════════════════════════════════════════

async function loadTasks() {
  try {
    if (API_BASE_URL) {
      tasks = await apiFetch("/tasks");
      showStatus("Loaded from AWS", "success");
    } else {
      tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
      showStatus("Local mode — set API_BASE_URL to sync with AWS", "");
    }
  } catch (e) {
    // Fallback to localStorage on any error
    tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
    showStatus("Offline — using local storage", "error");
  }
  render();
}

// ══════════════════════════════════════════════════════════
// ADD TASK
// ══════════════════════════════════════════════════════════

async function addTask(title, description) {
  const task = { title, description };

  try {
    if (API_BASE_URL) {
      const created = await apiFetch("/tasks", {
        method: "POST",
        body: JSON.stringify(task),
      });
      tasks.unshift(created);
      showStatus("Task added to AWS", "success");
    } else {
      // Local mode — create with local ID
      const localTask = {
        id: "local-" + Date.now(),
        title,
        description,
        status: "active",
        created_at: new Date().toISOString(),
      };
      tasks.unshift(localTask);
      saveLocal();
      showStatus("Task added locally", "success");
    }
  } catch (e) {
    showStatus(e.message, "error");
  }
  render();
}

// ══════════════════════════════════════════════════════════
// TOGGLE TASK (active <-> done)
// ══════════════════════════════════════════════════════════

async function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  try {
    if (API_BASE_URL) {
      const updated = await apiFetch(`/tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify({}),
      });
      Object.assign(task, updated);
      showStatus("Task updated", "success");
    } else {
      task.status = task.status === "active" ? "done" : "active";
      saveLocal();
    }
  } catch (e) {
    showStatus(e.message, "error");
  }
  render();
}

// ══════════════════════════════════════════════════════════
// DELETE TASK
// ══════════════════════════════════════════════════════════

async function deleteTask(id) {
  try {
    if (API_BASE_URL) {
      await apiFetch(`/tasks/${id}`, { method: "DELETE" });
      showStatus("Task deleted", "success");
    } else {
      showStatus("Task deleted locally", "success");
    }
    tasks = tasks.filter((t) => t.id !== id);
  } catch (e) {
    showStatus(e.message, "error");
  }
  render();
}

// ══════════════════════════════════════════════════════════
// RENDER
// ══════════════════════════════════════════════════════════

function render() {
  listEl.innerHTML = "";

  const filtered = tasks.filter((t) => {
    if (currentFilter === "all") return true;
    return t.status === currentFilter;
  });

  if (filtered.length === 0) {
    listEl.innerHTML =
      '<div class="empty-state">No tasks yet. Add one above!</div>';
    return;
  }

  for (const task of filtered) {
    const li = document.createElement("li");
    li.className = "task-item" + (task.status === "done" ? " done" : "");

    // Checkbox
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox";
    checkbox.checked = task.status === "done";
    checkbox.addEventListener("click", () => toggleTask(task.id));

    // Content
    const content = document.createElement("div");
    content.className = "task-content";

    const title = document.createElement("div");
    title.className = "task-title";
    title.textContent = task.title;
    content.appendChild(title);

    if (task.description) {
      const desc = document.createElement("div");
      desc.className = "task-desc";
      desc.textContent = task.description;
      content.appendChild(desc);
    }

    const date = document.createElement("div");
    date.className = "task-date";
    date.textContent = formatDate(task.created_at);
    content.appendChild(date);

    // Delete button
    const delBtn = document.createElement("button");
    delBtn.className = "task-delete";
    delBtn.innerHTML = "&times;";
    delBtn.addEventListener("click", () => deleteTask(task.id));

    li.appendChild(checkbox);
    li.appendChild(content);
    li.appendChild(delBtn);
    listEl.appendChild(li);
  }
}

// ══════════════════════════════════════════════════════════
// UTILITY
// ══════════════════════════════════════════════════════════

function saveLocal() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function formatDate(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  return (
    d.toLocaleDateString() +
    " " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
}

function showStatus(msg, type) {
  statusEl.textContent = msg;
  statusEl.className = "status-msg " + (type || "");
  setTimeout(() => {
    statusEl.textContent = "";
  }, 3000);
}

// ══════════════════════════════════════════════════════════
// EVENT LISTENERS
// ══════════════════════════════════════════════════════════

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  const desc = descInput.value.trim();
  if (!title) return;
  addTask(title, desc);
  titleInput.value = "";
  descInput.value = "";
  titleInput.focus();
});

filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    render();
  });
});

// ══════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════
loadTasks();
