// ===== app.js =====

// --------------------
// HELPERS
// --------------------
function getStorageKey(exerciseId) {
  return `workout-${exerciseId}`;
}

// --------------------
// MODAL ELEMENTS / TRACKING
// --------------------
let currentExerciseId = "";
const exerciseModal = document.getElementById("exerciseModal");

if (exerciseModal) {
  const modalExerciseName = document.getElementById("modalExerciseName");
  const weightInput = document.getElementById("weight");
  const setsInput = document.getElementById("sets");
  const repsInput = document.getElementById("reps");
  const notesInput = document.getElementById("notes");
  const exerciseHistory = document.getElementById("exerciseHistory");
  const saveBtn = document.getElementById("saveExercise");
  const cancelBtn = document.getElementById("cancelExercise");

  // --------------------
  // OPEN EXERCISE MODAL (delegated - works for all .exercise a)
  // --------------------
  document.addEventListener("click", (e) => {
    const link = e.target.closest(".exercise a");
    if (!link) return; // clicked something else

    e.preventDefault();

    // in case you ever make delete buttons as links
    if (link.classList.contains("delete-exercise")) return;

    const exEl = link.closest(".exercise");
    if (!exEl) return;

    const id = exEl.dataset.exerciseId;
    const rawText = link.textContent;
    const name = rawText.split("–")[0].trim(); // everything before "–"

    openExerciseModal(id, name);
  });

  function openExerciseModal(id, name) {
    currentExerciseId = id;
    modalExerciseName.textContent = name;

    // Load last saved data
    const saved = JSON.parse(localStorage.getItem(getStorageKey(id))) || {};
    weightInput.value = saved.weight || "";
    setsInput.value = saved.sets || "";
    repsInput.value = saved.reps || "";
    notesInput.value = saved.notes || "";

    displayHistory(id);
    exerciseModal.style.display = "flex";
  }

  // --------------------
  // DISPLAY HISTORY
  // --------------------
  function displayHistory(id) {
    exerciseHistory.innerHTML = "";
    const history =
      JSON.parse(localStorage.getItem(getStorageKey(id) + "-history")) || [];

    if (!history.length) {
      exerciseHistory.innerHTML = "<p>No previous records.</p>";
      return;
    }

    history
      .slice(-5)
      .reverse()
      .forEach((r) => {
        const div = document.createElement("div");
        div.className = "history-item";
        div.innerHTML = `
          <div class="date">${new Date(r.date).toLocaleDateString()}</div>
          <div>${r.weight} × ${r.sets}×${r.reps}</div>
          ${r.notes ? `<div>${r.notes}</div>` : ""}
        `;
        exerciseHistory.appendChild(div);
      });
  }

  // --------------------
  // SAVE EXERCISE
  // --------------------
  saveBtn.addEventListener("click", () => {
    if (!weightInput.value || !setsInput.value || !repsInput.value) {
      alert("Please fill in weight, sets, and reps.");
      return;
    }

    const data = {
      date: new Date().toISOString(),
      weight: weightInput.value,
      sets: setsInput.value,
      reps: repsInput.value,
      notes: notesInput.value,
    };

    // Save main data
    localStorage.setItem(
      getStorageKey(currentExerciseId),
      JSON.stringify(data),
    );

    // Save history
    const histKey = getStorageKey(currentExerciseId) + "-history";
    const history = JSON.parse(localStorage.getItem(histKey)) || [];
    history.push(data);
    localStorage.setItem(histKey, JSON.stringify(history));

    exerciseModal.style.display = "none";

    // Update stats label on the card(s)
    updateExerciseStats(currentExerciseId);
  });

  // Close modal
  cancelBtn.addEventListener("click", () => {
    exerciseModal.style.display = "none";
  });

  // --------------------
  // UPDATE STATS
  // --------------------
  function updateExerciseStats(id) {
    const exEls = document.querySelectorAll(`[data-exercise-id="${id}"]`);
    if (!exEls.length) return;

    const saved = JSON.parse(localStorage.getItem(getStorageKey(id)));
    const text = saved ? `${saved.weight} × ${saved.sets}×${saved.reps}` : "";

    exEls.forEach((exEl) => {
      const statsEl = exEl.querySelector(".exercise-stats");
      if (statsEl) {
        statsEl.textContent = text;
      }
    });
  }

  function updateAllStats() {
    document.querySelectorAll(".exercise").forEach((el) => {
      const id = el.dataset.exerciseId;
      if (id) updateExerciseStats(id);
    });
  }

  document.addEventListener("DOMContentLoaded", updateAllStats);
}

// --------------------
// EXPORT / IMPORT
// --------------------
function exportData() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith("workout-")) data[key] = localStorage.getItem(key);
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `workout-data-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = JSON.parse(e.target.result);
    Object.keys(data).forEach((k) => localStorage.setItem(k, data[k]));
    alert("Workout data imported!");
    // after import, refresh stats if we have the helper
    if (typeof document !== "undefined") {
      document.querySelectorAll(".exercise").forEach((el) => {
        const id = el.dataset.exerciseId;
        if (!id) return;
        const saved = JSON.parse(localStorage.getItem(getStorageKey(id)));
        const statsEl = el.querySelector(".exercise-stats");
        if (statsEl) {
          statsEl.textContent = saved
            ? `${saved.weight} × ${saved.sets}×${saved.reps}`
            : "";
        }
      });
    }
  };
  reader.readAsText(file);
}

// --------------------
// CUSTOM EXERCISES
// --------------------
document.addEventListener("DOMContentLoaded", function () {
  const workoutKey = window.location.pathname
    .split("/")
    .pop()
    .replace(".html", "");

  const addExerciseModal = document.getElementById("addExerciseModal");
  const customNameInput = document.getElementById("customExerciseName");
  const saveCustomBtn = document.getElementById("saveCustomExercise");
  const cancelCustomBtn = document.getElementById("cancelCustomExercise");
  const openCustomBtn = document.getElementById("openAddExercise");

  const customContainer = document.getElementById(
    `${workoutKey}-custom-exercises`,
  );

  // Open custom exercise modal
  if (openCustomBtn && addExerciseModal) {
    openCustomBtn.addEventListener("click", () => {
      addExerciseModal.style.display = "flex";
    });
  }

  // Close custom exercise modal
  if (cancelCustomBtn) {
    cancelCustomBtn.addEventListener("click", () => {
      addExerciseModal.style.display = "none";
    });
  }

  // Save new custom exercise
  if (saveCustomBtn && customContainer) {
    saveCustomBtn.addEventListener("click", () => {
      const name = customNameInput.value.trim();
      if (!name) {
        alert("Please enter an exercise name.");
        return;
      }

      const id = `${workoutKey}-custom-${Date.now()}`;

      const exerciseHTML = `
        <div class="exercise" data-exercise-id="${id}">
          <a href="#">${name}</a>
          <span class="exercise-stats"></span>
          <input type="checkbox" />
        </div>
      `;

      customContainer.insertAdjacentHTML("beforeend", exerciseHTML);

      const storageKey = `${workoutKey}-custom-exercises`;
      const saved = JSON.parse(localStorage.getItem(storageKey)) || [];

      saved.push({ id, name });
      localStorage.setItem(storageKey, JSON.stringify(saved));

      addExerciseModal.style.display = "none";
      customNameInput.value = "";
    });
  }

  // Load saved custom exercises
  if (customContainer) {
    const storageKey = `${workoutKey}-custom-exercises`;
    const saved = JSON.parse(localStorage.getItem(storageKey)) || [];

    saved.forEach((ex) => {
      const exerciseHTML = `
        <div class="exercise" data-exercise-id="${ex.id}">
          <a href="#">${ex.name}</a>
          <span class="exercise-stats"></span>
          <input type="checkbox" />
        </div>
      `;
      customContainer.insertAdjacentHTML("beforeend", exerciseHTML);
    });
  }
});

// --------------------
// LAYOUT LOGIC (alternatives / make main / add to today)
// --------------------

// Toggle alternatives inside each subsection
document.addEventListener("click", (e) => {
  if (e.target.matches(".alt-toggle")) {
    const btn = e.target;
    const block = btn.closest(".subsection");
    if (!block) return;
    const altList = block.querySelector(".alt-list");
    if (!altList) return;

    altList.classList.toggle("is-collapsed");
    btn.textContent = altList.classList.contains("is-collapsed")
      ? "Show alternatives"
      : "Hide alternatives";
  }
});

// Swap / add / remove exercises between Today and Alternatives
document.addEventListener("click", (e) => {
  // Make Main (swap)
  if (e.target.matches(".swap-btn")) {
    const altExercise = e.target.closest(".exercise");
    if (!altExercise) return;

    const block = altExercise.closest(".subsection");
    if (!block) return;

    const todayContainer = block.querySelector(".today-exercise");
    if (!todayContainer) return;

    const currentMain = todayContainer.querySelector(".exercise.is-main");
    if (!currentMain) return;

    const placeholder = document.createElement("div");

    altExercise.replaceWith(placeholder);
    todayContainer.replaceChild(altExercise, currentMain);
    placeholder.replaceWith(currentMain);

    altExercise.classList.add("is-main");
    altExercise.classList.remove("is-extra");
    currentMain.classList.remove("is-main");
    return;
  }

  // Add to Today (clone)
  if (e.target.matches(".add-btn")) {
    const altExercise = e.target.closest(".exercise");
    if (!altExercise) return;

    const block = altExercise.closest(".subsection");
    if (!block) return;

    const todayContainer = block.querySelector(".today-exercise");
    if (!todayContainer) return;

    const clone = altExercise.cloneNode(true);
    clone.classList.add("is-extra");
    clone.classList.remove("is-main");

    // Remove swap/add buttons from the clone
    clone.querySelectorAll(".swap-btn, .add-btn").forEach((b) => b.remove());

    // Ensure checkbox is fresh
    const checkbox = clone.querySelector('input[type="checkbox"]');
    if (checkbox) checkbox.checked = false;

    // Add remove button
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "remove-today-btn";
    removeBtn.textContent = "Remove";
    clone.appendChild(removeBtn);

    todayContainer.appendChild(clone);
    return;
  }

  // Remove extra from Today
  if (e.target.matches(".remove-today-btn")) {
    const exercise = e.target.closest(".exercise");
    if (exercise && exercise.classList.contains("is-extra")) {
      exercise.remove();
    }
  }
});
