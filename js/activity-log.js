"use strict";
const ACTIVITY_LOG_KEY = "workoutCalendarLog";
function activityDateKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function activityId() {
  return crypto && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("activityModal");
  if (!modal) return;
  const title = document.getElementById("activityModalTitle"),
    date = document.getElementById("activityDate"),
    notes = document.getElementById("activityNotes");
  let type = "";
  const names = {
    climbing: "Rock Climbing",
    physio: "Physio / Rehab",
    mobility: "Mobility / Stretching",
  };
  document.querySelectorAll("[data-activity]").forEach((b) =>
    b.addEventListener("click", () => {
      type = b.dataset.logActivity;
      title.textContent = `Log ${names[type]}`;
      date.value = activityDateKey();
      notes.value = "";
      modal.style.display = "flex";
    }),
  );
  document
    .getElementById("cancelActivity")
    .addEventListener("click", () => (modal.style.display = "none"));
  document.getElementById("saveActivity").addEventListener("click", () => {
    if (!type || !date.value) return;
    let log = [];
    try {
      log = JSON.parse(localStorage.getItem(ACTIVITY_LOG_KEY) || "[]");
      if (!Array.isArray(log)) log = [];
    } catch {
      log = [];
    }
    log.push({
      id: activityId(),
      date: date.value,
      timestamp: new Date().toISOString(),
      type,
      workoutName: names[type],
      notes: notes.value.trim(),
    });
    localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(log));
    modal.style.display = "none";
    alert(`${names[type]} logged!`);
  });
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });
  const hash = location.hash.replace("#activity-", "");
  if (names[hash]) document.querySelector(`[data-activity="${hash}"]`)?.click();
});
