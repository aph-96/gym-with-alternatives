// ===== app.js =====

// --------------------
// STORAGE KEYS
// --------------------
const WORKOUT_LOG_STORAGE_KEY = "workoutCalendarLog";

// --------------------
// GENERAL HELPERS
// --------------------
function getStorageKey(exerciseId) {
  return `workout-${exerciseId}`;
}

function safelyReadJSON(storageKey, fallbackValue = null) {
  try {
    const storedValue = localStorage.getItem(storageKey);

    if (!storedValue) {
      return fallbackValue;
    }

    return JSON.parse(storedValue);
  } catch (error) {
    console.error(`Could not read ${storageKey}:`, error);
    return fallbackValue;
  }
}

// --------------------
// WORKOUT CALENDAR HELPERS
// --------------------
function getWorkoutCalendarLog() {
  const savedLog = safelyReadJSON(WORKOUT_LOG_STORAGE_KEY, []);

  return Array.isArray(savedLog) ? savedLog : [];
}

function getTodayDateKey() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getWorkoutPageName() {
  /*
   * data-workout-name is optional.
   *
   * You can add it to the body of each workout page:
   * <body data-workout-name="Glutes & Quads">
   *
   * This gives the calendar a cleaner workout name.
   */
  const bodyWorkoutName = document.body.dataset.workoutName;

  if (bodyWorkoutName) {
    return bodyWorkoutName.trim();
  }

  const pageHeading = document.querySelector("h1");

  if (pageHeading) {
    return pageHeading.textContent.trim();
  }

  return document.title || "Workout";
}

function createUniqueRecordId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function logExerciseForCalendar({
  exerciseId,
  exerciseName,
  weight,
  sets,
  reps,
  notes,
}) {
  const workoutLog = getWorkoutCalendarLog();

  const calendarRecord = {
    id: createUniqueRecordId(),
    date: getTodayDateKey(),
    timestamp: new Date().toISOString(),
    workoutName: getWorkoutPageName(),
    exerciseId,
    exerciseName,
    weight,
    sets,
    reps,
    notes,
  };

  workoutLog.push(calendarRecord);

  localStorage.setItem(WORKOUT_LOG_STORAGE_KEY, JSON.stringify(workoutLog));
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
  // OPEN EXERCISE MODAL
  // Delegated so it works for every .exercise link,
  // including dynamically added custom exercises.
  // --------------------
  document.addEventListener("click", (event) => {
    const link = event.target.closest(".exercise a");

    if (!link) {
      return;
    }

    event.preventDefault();

    if (link.classList.contains("delete-exercise")) {
      return;
    }

    const exerciseElement = link.closest(".exercise");

    if (!exerciseElement) {
      return;
    }

    const exerciseId = exerciseElement.dataset.exerciseId;

    if (!exerciseId) {
      console.warn(
        "This exercise is missing a data-exercise-id.",
        exerciseElement,
      );
      return;
    }

    const rawText = link.textContent.trim();

    /*
     * Takes everything before the long dash.
     *
     * Example:
     * "Hip Thrust – 3×8" becomes "Hip Thrust".
     */
    const exerciseName = rawText.split("–")[0].trim();

    openExerciseModal(exerciseId, exerciseName);
  });

  function openExerciseModal(exerciseId, exerciseName) {
    currentExerciseId = exerciseId;
    modalExerciseName.textContent = exerciseName;

    const saved = safelyReadJSON(getStorageKey(exerciseId), {}) || {};

    weightInput.value = saved.weight || "";
    setsInput.value = saved.sets || "";
    repsInput.value = saved.reps || "";
    notesInput.value = saved.notes || "";

    displayHistory(exerciseId);

    exerciseModal.style.display = "flex";
  }

  // --------------------
  // CLOSE MODALS BY CLICKING OUTSIDE
  // --------------------
  window.addEventListener("click", (event) => {
    if (event.target === exerciseModal) {
      exerciseModal.style.display = "none";
    }

    const addExerciseModal = document.getElementById("addExerciseModal");

    if (addExerciseModal && event.target === addExerciseModal) {
      addExerciseModal.style.display = "none";
    }
  });

  // --------------------
  // DISPLAY EXERCISE HISTORY
  // --------------------
  function displayHistory(exerciseId) {
    exerciseHistory.innerHTML = "";

    const historyKey = `${getStorageKey(exerciseId)}-history`;

    const history = safelyReadJSON(historyKey, []) || [];

    if (!history.length) {
      exerciseHistory.innerHTML = "<p>No previous records.</p>";

      return;
    }

    history
      .slice(-5)
      .reverse()
      .forEach((record) => {
        const historyItem = document.createElement("div");

        historyItem.className = "history-item";

        const formattedDate = new Date(record.date).toLocaleDateString("en-IE");

        historyItem.innerHTML = `
          <div class="date">${formattedDate}</div>
          <div>
            ${record.weight} ×
            ${record.sets}×${record.reps}
          </div>
          ${record.notes ? `<div>${record.notes}</div>` : ""}
        `;

        exerciseHistory.appendChild(historyItem);
      });
  }

  // --------------------
  // SAVE EXERCISE
  // --------------------
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      if (!weightInput.value || !setsInput.value || !repsInput.value) {
        alert("Please fill in weight, sets, and reps.");

        return;
      }

      if (!currentExerciseId) {
        alert("No exercise is currently selected.");
        return;
      }

      const exerciseName = modalExerciseName.textContent.trim();

      const data = {
        date: new Date().toISOString(),
        weight: weightInput.value.trim(),
        sets: setsInput.value.trim(),
        reps: repsInput.value.trim(),
        notes: notesInput.value.trim(),
      };

      // Save latest data for this exercise.
      localStorage.setItem(
        getStorageKey(currentExerciseId),
        JSON.stringify(data),
      );

      // Add a new entry to this exercise's history.
      const historyKey = `${getStorageKey(currentExerciseId)}-history`;

      const history = safelyReadJSON(historyKey, []) || [];

      history.push(data);

      localStorage.setItem(historyKey, JSON.stringify(history));

      /*
       * Add this completed exercise to the calendar.
       *
       * Every exercise saved on the same date will
       * appear under one calendar dot for that date.
       */
      logExerciseForCalendar({
        exerciseId: currentExerciseId,
        exerciseName,
        weight: data.weight,
        sets: data.sets,
        reps: data.reps,
        notes: data.notes,
      });

      exerciseModal.style.display = "none";

      updateExerciseStats(currentExerciseId);
    });
  }

  // --------------------
  // CANCEL EXERCISE MODAL
  // --------------------
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      exerciseModal.style.display = "none";
    });
  }

  // --------------------
  // UPDATE EXERCISE STATS
  // --------------------
  function updateExerciseStats(exerciseId) {
    const exerciseElements = document.querySelectorAll(
      `[data-exercise-id="${exerciseId}"]`,
    );

    if (!exerciseElements.length) {
      return;
    }

    const saved = safelyReadJSON(getStorageKey(exerciseId), null);

    const statsText = saved
      ? `${saved.weight} × ${saved.sets}×${saved.reps}`
      : "";

    exerciseElements.forEach((exerciseElement) => {
      const statsElement = exerciseElement.querySelector(".exercise-stats");

      if (statsElement) {
        statsElement.textContent = statsText;
      }
    });
  }

  function updateAllStats() {
    document.querySelectorAll(".exercise").forEach((exerciseElement) => {
      const exerciseId = exerciseElement.dataset.exerciseId;

      if (exerciseId) {
        updateExerciseStats(exerciseId);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", updateAllStats);
  } else {
    updateAllStats();
  }
}

// --------------------
// EXPORT DATA
// --------------------
function exportData() {
  const data = {};

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);

    if (!key) {
      continue;
    }

    /*
     * Export:
     * - regular workout records
     * - exercise histories
     * - custom exercises
     * - calendar workout log
     */
    if (
      key.startsWith("workout-") ||
      key.endsWith("-custom-exercises") ||
      key === WORKOUT_LOG_STORAGE_KEY
    ) {
      data[key] = localStorage.getItem(key);
    }
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");

  downloadLink.href = url;
  downloadLink.download = `workout-data-${getTodayDateKey()}.json`;

  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();

  URL.revokeObjectURL(url);
}

// --------------------
// IMPORT DATA
// --------------------
function importData(event) {
  const file = event.target.files[0];

  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.onload = (loadEvent) => {
    try {
      const data = JSON.parse(loadEvent.target.result);

      Object.keys(data).forEach((key) => {
        localStorage.setItem(key, data[key]);
      });

      alert("Workout data imported!");

      document.querySelectorAll(".exercise").forEach((exerciseElement) => {
        const exerciseId = exerciseElement.dataset.exerciseId;

        if (!exerciseId) {
          return;
        }

        const saved = safelyReadJSON(getStorageKey(exerciseId), null);

        const statsElement = exerciseElement.querySelector(".exercise-stats");

        if (statsElement) {
          statsElement.textContent = saved
            ? `${saved.weight} × ${saved.sets}×${saved.reps}`
            : "";
        }
      });
    } catch (error) {
      console.error("Could not import workout data:", error);

      alert(
        "That file could not be imported. Please choose a valid workout backup.",
      );
    }
  };

  reader.readAsText(file);
}

// --------------------
// CUSTOM EXERCISES
// --------------------
document.addEventListener("DOMContentLoaded", () => {
  const currentFilename = window.location.pathname.split("/").pop() || "";

  const workoutKey = currentFilename.replace(".html", "");

  const addExerciseModal = document.getElementById("addExerciseModal");

  const customNameInput = document.getElementById("customExerciseName");

  const saveCustomButton = document.getElementById("saveCustomExercise");

  const cancelCustomButton = document.getElementById("cancelCustomExercise");

  const openCustomButton = document.getElementById("openAddExercise");

  const customContainer = document.getElementById(
    `${workoutKey}-custom-exercises`,
  );

  // Open custom exercise modal.
  if (openCustomButton && addExerciseModal) {
    openCustomButton.addEventListener("click", () => {
      addExerciseModal.style.display = "flex";
    });
  }

  // Close custom exercise modal.
  if (cancelCustomButton && addExerciseModal) {
    cancelCustomButton.addEventListener("click", () => {
      addExerciseModal.style.display = "none";
    });
  }

  // Save a new custom exercise.
  if (
    saveCustomButton &&
    customContainer &&
    customNameInput &&
    addExerciseModal
  ) {
    saveCustomButton.addEventListener("click", () => {
      const exerciseName = customNameInput.value.trim();

      if (!exerciseName) {
        alert("Please enter an exercise name.");

        return;
      }

      const exerciseId = `${workoutKey}-custom-${Date.now()}`;

      const exerciseHTML = `
            <div
              class="exercise"
              data-exercise-id="${exerciseId}"
            >
              <a href="#">${exerciseName}</a>
              <span class="exercise-stats"></span>
              <input type="checkbox" />
            </div>
          `;

      customContainer.insertAdjacentHTML("beforeend", exerciseHTML);

      const customStorageKey = `${workoutKey}-custom-exercises`;

      const savedCustomExercises = safelyReadJSON(customStorageKey, []) || [];

      savedCustomExercises.push({
        id: exerciseId,
        name: exerciseName,
      });

      localStorage.setItem(
        customStorageKey,
        JSON.stringify(savedCustomExercises),
      );

      addExerciseModal.style.display = "none";

      customNameInput.value = "";
    });
  }

  // Load saved custom exercises.
  if (customContainer) {
    const customStorageKey = `${workoutKey}-custom-exercises`;

    const savedCustomExercises = safelyReadJSON(customStorageKey, []) || [];

    savedCustomExercises.forEach((exercise) => {
      const exerciseHTML = `
            <div
              class="exercise"
              data-exercise-id="${exercise.id}"
            >
              <a href="#">${exercise.name}</a>
              <span class="exercise-stats"></span>
              <input type="checkbox" />
            </div>
          `;

      customContainer.insertAdjacentHTML("beforeend", exerciseHTML);
    });
  }
});

// --------------------
// LAYOUT LOGIC
// Alternatives / Make Main / Add to Today
// --------------------

// Toggle alternatives inside each subsection.
document.addEventListener("click", (event) => {
  if (!event.target.matches(".alt-toggle")) {
    return;
  }

  const toggleButton = event.target;

  const subsection = toggleButton.closest(".subsection");

  if (!subsection) {
    return;
  }

  const alternativesList = subsection.querySelector(".alt-list");

  if (!alternativesList) {
    return;
  }

  alternativesList.classList.toggle("is-collapsed");

  toggleButton.textContent = alternativesList.classList.contains("is-collapsed")
    ? "Show alternatives"
    : "Hide alternatives";
});

// Swap, add or remove exercises.
document.addEventListener("click", (event) => {
  // --------------------
  // MAKE MAIN
  // --------------------
  if (event.target.matches(".swap-btn")) {
    const alternativeExercise = event.target.closest(".exercise");

    if (!alternativeExercise) {
      return;
    }

    const subsection = alternativeExercise.closest(".subsection");

    if (!subsection) {
      return;
    }

    const todayContainer = subsection.querySelector(".today-exercise");

    if (!todayContainer) {
      return;
    }

    const currentMainExercise =
      todayContainer.querySelector(".exercise.is-main");

    if (!currentMainExercise) {
      return;
    }

    const placeholder = document.createElement("div");

    alternativeExercise.replaceWith(placeholder);

    todayContainer.replaceChild(alternativeExercise, currentMainExercise);

    placeholder.replaceWith(currentMainExercise);

    alternativeExercise.classList.add("is-main");

    alternativeExercise.classList.remove("is-extra");

    currentMainExercise.classList.remove("is-main");

    return;
  }

  // --------------------
  // ADD TO TODAY
  // --------------------
  if (event.target.matches(".add-btn")) {
    const alternativeExercise = event.target.closest(".exercise");

    if (!alternativeExercise) {
      return;
    }

    const subsection = alternativeExercise.closest(".subsection");

    if (!subsection) {
      return;
    }

    const todayContainer = subsection.querySelector(".today-exercise");

    if (!todayContainer) {
      return;
    }

    const clone = alternativeExercise.cloneNode(true);

    clone.classList.add("is-extra");
    clone.classList.remove("is-main");

    clone.querySelectorAll(".swap-btn, .add-btn").forEach((button) => {
      button.remove();
    });

    const checkbox = clone.querySelector('input[type="checkbox"]');

    if (checkbox) {
      checkbox.checked = false;
    }

    const removeButton = document.createElement("button");

    removeButton.type = "button";
    removeButton.className = "remove-today-btn";

    removeButton.textContent = "Remove";

    clone.appendChild(removeButton);
    todayContainer.appendChild(clone);

    return;
  }

  // --------------------
  // REMOVE FROM TODAY
  // --------------------
  if (event.target.matches(".remove-today-btn")) {
    const exercise = event.target.closest(".exercise");

    if (exercise && exercise.classList.contains("is-extra")) {
      exercise.remove();
    }
  }
});
