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

function getWorkoutLog() {
  try {
    const savedLog = localStorage.getItem(WORKOUT_LOG_STORAGE_KEY);

    if (!savedLog) {
      return [];
    }

    const parsedLog = JSON.parse(savedLog);

    return Array.isArray(parsedLog) ? parsedLog : [];
  } catch (error) {
    console.error("Could not read workout calendar log:", error);
    return [];
  }
}

function getLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatMonth(date) {
  return new Intl.DateTimeFormat("en-IE", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatFullDate(dateKey) {
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

function createEmptyCalendarCell() {
  const emptyCell = document.createElement("div");
  emptyCell.className = "calendar-empty-day";

  return emptyCell;
}

function createCalendarDay(date) {
  const dateKey = getLocalDateKey(date);
  const entries = getEntriesForDate(dateKey);
  const hasWorkout = entries.length > 0;

  const todayKey = getLocalDateKey(new Date());

  const dayButton = document.createElement("button");
  dayButton.type = "button";
  dayButton.className = "calendar-day";
  dayButton.dataset.date = dateKey;

  if (dateKey === todayKey) {
    dayButton.classList.add("is-today");
  }

  const number = document.createElement("span");
  number.className = "calendar-day-number";
  number.textContent = date.getDate();

  dayButton.append(number);

  if (hasWorkout) {
    dayButton.classList.add("has-workout");

    const dot = document.createElement("span");
    dot.className = "calendar-workout-dot";
    dot.setAttribute("aria-hidden", "true");

    dayButton.append(dot);

    dayButton.setAttribute(
      "aria-label",
      `${formatFullDate(dateKey)}: ${entries.length} exercises logged`,
    );

    dayButton.addEventListener("click", () => {
      openWorkoutDay(dateKey);
    });
  } else {
    dayButton.setAttribute(
      "aria-label",
      `${formatFullDate(dateKey)}: no workout logged`,
    );
  }

  return dayButton;
}

function renderCalendar() {
  calendarGrid.innerHTML = "";
  calendarMonth.textContent = formatMonth(displayedDate);

  const year = displayedDate.getFullYear();
  const month = displayedDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  /*
   * JavaScript uses:
   * Sunday = 0
   * Monday = 1
   *
   * This converts it so the calendar begins on Monday.
   */
  const leadingBlankDays = (firstDayOfMonth.getDay() + 6) % 7;

  for (let index = 0; index < leadingBlankDays; index += 1) {
    calendarGrid.append(createEmptyCalendarCell());
  }

  for (let day = 1; day <= lastDayOfMonth.getDate(); day += 1) {
    const date = new Date(year, month, day);
    calendarGrid.append(createCalendarDay(date));
  }
}

function groupEntriesByWorkout(entries) {
  return entries.reduce((groups, entry) => {
    const workoutName = entry.workoutName || "Other exercises";

    if (!groups[workoutName]) {
      groups[workoutName] = [];
    }

    groups[workoutName].push(entry);

    return groups;
  }, {});
}

function addRecordDetail(container, label, value) {
  if (value === undefined || value === null || value === "") {
    return;
  }

  const detail = document.createElement("p");

  const strong = document.createElement("strong");
  strong.textContent = `${label}: `;

  detail.append(strong, document.createTextNode(String(value)));
  container.append(detail);
}

function createExerciseRecord(entry) {
  const record = document.createElement("article");
  record.className = "calendar-exercise-record";

  const exerciseName = document.createElement("h4");
  exerciseName.textContent = entry.exerciseName || "Exercise";

  record.append(exerciseName);

  addRecordDetail(record, "Weight/band", entry.weight);
  addRecordDetail(record, "Sets", entry.sets);
  addRecordDetail(record, "Reps", entry.reps);
  addRecordDetail(record, "Notes", entry.notes);

  return record;
}

function openWorkoutDay(dateKey) {
  const entries = getEntriesForDate(dateKey);

  workoutDayTitle.textContent = formatFullDate(dateKey);

  workoutDayCount.textContent =
    entries.length === 1
      ? "1 exercise logged"
      : `${entries.length} exercises logged`;

  workoutDayExercises.innerHTML = "";

  const groupedEntries = groupEntriesByWorkout(entries);

  Object.entries(groupedEntries).forEach(([workoutName, workoutEntries]) => {
    const group = document.createElement("section");
    group.className = "calendar-workout-group";

    const heading = document.createElement("h3");
    heading.textContent = workoutName;

    group.appendChild(heading);

    workoutEntries.forEach((entry) => {
      group.appendChild(createExerciseRecord(entry));
    });

    workoutDayExercises.appendChild(group);
  });

  workoutDayModal.style.display = "flex";
}

function closeWorkoutDay() {
  workoutDayModal.style.display = "none";
}

previousMonthButton.addEventListener("click", () => {
  displayedDate.setMonth(displayedDate.getMonth() - 1);
  renderCalendar();
});

nextMonthButton.addEventListener("click", () => {
  displayedDate.setMonth(displayedDate.getMonth() + 1);
  renderCalendar();
});

closeWorkoutDayButton.addEventListener("click", closeWorkoutDay);

workoutDayModal.addEventListener("click", (event) => {
  if (event.target === workoutDayModal) {
    closeWorkoutDay();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeWorkoutDay();
  }
});

renderCalendar();
