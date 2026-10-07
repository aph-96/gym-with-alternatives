"use strict";

const WORKOUT_LOG_STORAGE_KEY = "workoutCalendarLog";

const calendarMonth = document.getElementById("calendarMonth");
const calendarGrid = document.getElementById("calendarGrid");
const previousMonthButton = document.getElementById("previousMonth");
const nextMonthButton = document.getElementById("nextMonth");

const workoutDayModal = document.getElementById("workoutDayModal");
const closeWorkoutDayButton = document.getElementById("closeWorkoutDay");
const workoutDayTitle = document.getElementById("workoutDayTitle");
const workoutDayCount = document.getElementById("workoutDayCount");
const workoutDayExercises = document.getElementById("workoutDayExercises");

let displayedDate = new Date();
displayedDate.setDate(1);

/* ========================================
   GET SAVED WORKOUT / ACTIVITY DATA
======================================== */

function getWorkoutLog() {
  try {
    const log = JSON.parse(
      localStorage.getItem(WORKOUT_LOG_STORAGE_KEY) || "[]",
    );

    return Array.isArray(log) ? log : [];
  } catch {
    return [];
  }
}

/* ========================================
   ACTIVITY TYPE
======================================== */

/*
  Older workout records don't have a "type".
  Treat those as normal workouts so old data
  continues to work.
*/
function getActivityType(entry) {
  return entry.type || "workout";
}

/* ========================================
   DATE HELPERS
======================================== */

function getDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function getFullDate(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);

  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("en-IE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getEntriesForDate(dateKey) {
  return getWorkoutLog().filter((entry) => entry.date === dateKey);
}

/* ========================================
   CREATE CALENDAR DAY
======================================== */

function createCalendarDay(date) {
  const dateKey = getDateKey(date);
  const entries = getEntriesForDate(dateKey);

  const button = document.createElement("button");

  button.type = "button";
  button.className = "calendar-day";
  button.dataset.date = dateKey;

  // Highlight today
  if (dateKey === getDateKey(new Date())) {
    button.classList.add("is-today");
  }

  // Day number
  const dayNumber = document.createElement("span");

  dayNumber.className = "calendar-day-number";
  dayNumber.textContent = date.getDate();

  button.append(dayNumber);

  /*
    If something was logged on this date,
    add the appropriate coloured dots.

    Workout  = purple
    Climbing = blue
    Physio   = pink
    Mobility = light green
  */
  if (entries.length > 0) {
    button.classList.add("has-workout");

    const dotRow = document.createElement("span");
    dotRow.className = "calendar-dot-row";

    const activityTypes = [
      ...new Set(entries.map((entry) => getActivityType(entry))),
    ];

    activityTypes.forEach((activityType) => {
      const dot = document.createElement("span");

      dot.className = `calendar-workout-dot dot-${activityType}`;

      dotRow.append(dot);
    });

    button.append(dotRow);

    button.setAttribute(
      "aria-label",
      `${getFullDate(dateKey)}: activity logged`,
    );

    button.addEventListener("click", () => {
      openWorkoutDay(dateKey);
    });
  }

  return button;
}

/* ========================================
   RENDER CALENDAR
======================================== */

function renderCalendar() {
  calendarGrid.innerHTML = "";

  calendarMonth.textContent = new Intl.DateTimeFormat("en-IE", {
    month: "long",
    year: "numeric",
  }).format(displayedDate);

  const year = displayedDate.getFullYear();
  const month = displayedDate.getMonth();

  const lastDayOfMonth = new Date(year, month + 1, 0);

  /*
    JS week:
    Sunday = 0
    Monday = 1

    Our calendar starts on Monday,
    so convert it to Monday-first.
  */
  const leadingEmptyDays = (new Date(year, month, 1).getDay() + 6) % 7;

  // Empty spaces before the first day
  for (let i = 0; i < leadingEmptyDays; i++) {
    const emptyDay = document.createElement("div");

    emptyDay.className = "calendar-empty-day";

    calendarGrid.append(emptyDay);
  }

  // Actual days of the month
  for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
    const date = new Date(year, month, day);

    calendarGrid.append(createCalendarDay(date));
  }
}

/* ========================================
   ADD DETAIL TO MODAL
======================================== */

function addDetail(container, label, value) {
  if (value === undefined || value === null || value === "") {
    return;
  }

  const paragraph = document.createElement("p");
  const strong = document.createElement("strong");

  strong.textContent = `${label}: `;

  paragraph.append(strong, document.createTextNode(String(value)));

  container.append(paragraph);
}

/* ========================================
   OPEN DAY DETAILS
======================================== */

function openWorkoutDay(dateKey) {
  const entries = getEntriesForDate(dateKey);

  workoutDayTitle.textContent = getFullDate(dateKey);

  workoutDayCount.textContent = `${entries.length} ${
    entries.length === 1 ? "entry" : "entries"
  } logged`;

  workoutDayExercises.innerHTML = "";

  /*
    Group entries by workout/activity.

    Examples:
    Push
    Pull
    Legs
    Rock Climbing
    Physio / Rehab
    Mobility / Stretching
  */
  const groups = {};

  entries.forEach((entry) => {
    const groupName = entry.workoutName || "Workout";

    if (!groups[groupName]) {
      groups[groupName] = [];
    }

    groups[groupName].push(entry);
  });

  Object.entries(groups).forEach(([groupName, groupEntries]) => {
    const section = document.createElement("section");

    section.className = "calendar-workout-group";

    const heading = document.createElement("h3");

    heading.textContent = groupName;

    section.append(heading);

    groupEntries.forEach((entry) => {
      const record = document.createElement("article");

      const activityType = getActivityType(entry);

      record.className = `calendar-exercise-record activity-${activityType}`;

      const exerciseHeading = document.createElement("h4");

      exerciseHeading.textContent =
        entry.exerciseName || entry.workoutName || "Activity";

      record.append(exerciseHeading);

      // Workout details
      addDetail(record, "Weight/band", entry.weight);

      addDetail(record, "Sets", entry.sets);

      addDetail(record, "Reps", entry.reps);

      // Works for both workouts and activities
      addDetail(record, "Notes", entry.notes);

      section.append(record);
    });

    workoutDayExercises.append(section);
  });

  workoutDayModal.style.display = "flex";
}

/* ========================================
   CLOSE DAY DETAILS
======================================== */

function closeWorkoutDay() {
  workoutDayModal.style.display = "none";
}

/* ========================================
   PREVIOUS / NEXT MONTH
======================================== */

previousMonthButton.addEventListener("click", () => {
  displayedDate.setMonth(displayedDate.getMonth() - 1);

  renderCalendar();
});

nextMonthButton.addEventListener("click", () => {
  displayedDate.setMonth(displayedDate.getMonth() + 1);

  renderCalendar();
});

/* ========================================
   CLOSE MODAL
======================================== */

closeWorkoutDayButton.addEventListener("click", closeWorkoutDay);

// Close when clicking outside modal
workoutDayModal.addEventListener("click", (event) => {
  if (event.target === workoutDayModal) {
    closeWorkoutDay();
  }
});

// Close with Escape key
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeWorkoutDay();
  }
});

/* ========================================
   START CALENDAR
======================================== */

renderCalendar();
