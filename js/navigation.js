"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const menu = document.createElement("aside");
  menu.className = "app-drawer";
  menu.id = "appDrawer";
  menu.innerHTML = `
    <div class="drawer-header"><strong>GYM TRACKER</strong><button type="button" class="drawer-close" aria-label="Close menu">×</button></div>
    <nav class="drawer-nav">
      <p class="drawer-label">MAIN</p>
      <a href="index.html">⌂ Home</a><a href="workout-calendar.html">📅 Calendar</a>
      <p class="drawer-label">WORKOUT PLANS</p>
      <a href="push.html">🧡 Push</a><a href="pull.html">💙 Pull</a><a href="legs.html">🍑 Legs A</a><a href="legs2.html">💚 Legs B</a><a href="select-workout-pt.html">💪 Personal Training</a>
      <p class="drawer-label">BY MUSCLE</p>
      <a href="biceps.html">💪 Biceps</a><a href="back.html">🔵 Back</a><a href="shoulders.html">🟣 Shoulders</a><a href="triceps.html">🟠 Triceps</a><a href="chest.html">❤️ Chest</a><a href="quads.html">🦵 Quads</a><a href="glutes.html">🍑 Glutes</a><a href="hamstrings.html">🦵 Hamstrings</a><a href="calves.html">🐄 Calves</a><a href="core.html">🔥 Core</a>
      <p class="drawer-label">OTHER ACTIVITY</p>
      <a href="index.html#activity-climbing">🧗 Rock Climbing</a><a href="index.html#activity-physio">💗 Physio / Rehab</a><a href="index.html#activity-mobility">🧘 Mobility / Stretching</a>
    </nav>`;
  const overlay=document.createElement("div"); overlay.className="drawer-overlay";
  const button=document.createElement("button"); button.type="button"; button.className="hamburger-button"; button.setAttribute("aria-label","Open menu"); button.innerHTML="☰";
  document.body.prepend(overlay); document.body.prepend(menu); document.body.prepend(button);
  const open=()=>{menu.classList.add("is-open");overlay.classList.add("is-open")};
  const close=()=>{menu.classList.remove("is-open");overlay.classList.remove("is-open")};
  button.addEventListener("click",open); overlay.addEventListener("click",close); menu.querySelector(".drawer-close").addEventListener("click",close);
});
