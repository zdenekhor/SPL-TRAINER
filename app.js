/* =========================
   PRESENCE SYSTEM (Firebase Realtime Database)
========================= */

function getUserId() {
  let userId = localStorage.getItem("spl_user_id");

  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem("spl_user_id", userId);
  }

  return userId;
}

const userId = getUserId();

async function setupPresence() {

  if (!window.rtdb) {
    console.warn("Realtime Database není připravena");
    return;
  }

  const presenceRef = window.rtdbRef(
    window.rtdb,
    "presence/" + userId
  );

  try {

    await window.rtdbSet(presenceRef, {
      online: true,
      lastSeen: Date.now()
    });

    window.rtdbOnDisconnect(presenceRef).set({
      online: false,
      lastSeen: Date.now()
    });

    console.log("Presence nastavena");

  } catch (e) {

    console.error("Presence error:", e);

  }

}

function watchPresence() {

  if (!window.rtdb) return;

  const presenceRef = window.rtdbRef(
    window.rtdb,
    "presence"
  );

  window.rtdbOnValue(presenceRef, snapshot => {

    let total = 0;
    let online = 0;

    snapshot.forEach(child => {

      total++;

      if (child.val().online)
        online++;

    });

    console.log("👥 Online:", online, "| Celkem:", total);

    const box = document.getElementById("metarBox");

    if (box) {

      const baseText = box.innerText.split("\n")[0];

      box.innerText =
        baseText +
        `\n👥 Online: ${online} | Celkem: ${total}`;

    }

  });

}


/* =========================
   START PO NAČTENÍ STRÁNKY
========================= */

window.addEventListener("load", () => {

  setupPresence();
  watchPresence();

});


console.log("SPL READY");


/* =========================
   METAR
========================= */

async function loadMetar() {

  try {

    const response = await fetch(
      "https://corsproxy.io/?https://tgftp.nws.noaa.gov/data/observations/metar/stations/LKMT.TXT"
    );

    if (!response.ok)
      throw new Error("HTTP error " + response.status);

    const text = await response.text();
    const lines = text.trim().split("\n");
    const metar = lines[1] || "METAR není dostupný";

    const box = document.getElementById("metarBox");

    if (box) {

      const presenceLine = box.innerText.includes("👥")
        ? "\n" + box.innerText.split("\n")[1]
        : "";

      box.innerText = metar + presenceLine;

    }

  } catch (error) {

    console.warn("METAR error:", error);

  }

}

loadMetar();
setInterval(loadMetar, 300000);


/* =========================
   ZBYTEK VAŠÍ APLIKACE
========================= */

let data = {};
let currentQuestions = [];
let currentIndex = 0;
let score = 0;
let mode = "study";
let wrongQuestions = [];
let changeLog = {};


const categorySelect = document.getElementById("categorySelect");
const quizContainer = document.getElementById("quizContainer");
const resultBox = document.getElementById("result") || { innerHTML: "" };

const randomToggle = document.getElementById("randomQuestions");
const questionLimitInput = document.getElementById("questionCount");

const correctColorPicker = document.getElementById("correctColorPicker");
const wrongColorPicker = document.getElementById("wrongColorPicker");
const settingsToggle = document.getElementById("settingsToggle");
const settingsPanel = document.getElementById("settingsPanel");


if (settingsToggle && settingsPanel) {

  settingsToggle.addEventListener("click", () => {

    settingsPanel.style.display =
      settingsPanel.style.display === "none"
        ? "block"
        : "none";

  });

}


if (correctColorPicker) {

  correctColorPicker.addEventListener("input", e => {

    document.documentElement.style.setProperty(
      "--correctColor",
      e.target.value
    );

  });

}


if (wrongColorPicker) {

  wrongColorPicker.addEventListener("input", e => {

    document.documentElement.style.setProperty(
      "--wrongColor",
      e.target.value
    );

  });

}


fetch("./data.json")

  .then(res => res.json())

  .then(async json => {

    data = json;

    initCategories();

    await loadChangeLog();

    startStudy();

  });


function initCategories() {

  categorySelect.innerHTML = "";

  Object.keys(data).forEach(cat => {

    const option = document.createElement("option");

    option.value = cat;
    option.textContent = cat;

    categorySelect.appendChild(option);

  });

  categorySelect.addEventListener("change", () => {

    if (mode === "study") startStudy();
    if (mode === "test") startTest();
    if (mode === "edit") startEdit();

  });

}


async function loadChangeLog() {

  if (!window.db) return;

  const snapshot = await window.fbGetDocs(
    window.fbCollection(window.db, "questionChanges")
  );

  snapshot.forEach(doc => {

    const d = doc.data();

    const key = d.category + "|" + d.question;

    if (!changeLog[key])
      changeLog[key] = [];

    changeLog[key].push(d);

  });

}


function startStudy() {

  mode = "study";

  prepareQuestions();

  showQuestion();

}


function startTest() {

  mode = "test";

  score = 0;

  wrongQuestions = [];

  prepareQuestions();

  showQuestion();

}


function startEdit() {

  mode = "edit";

  prepareQuestions();

  showQuestion();

}


function prepareQuestions() {

  const category = categorySelect.value;

  currentQuestions = [...data[category]];

  currentIndex = 0;

  resultBox.innerHTML = "";

}


function showQuestion() {

  if (!currentQuestions.length) return;

  const q = currentQuestions[currentIndex];

  let html = `

  <div>
  Otázka ${currentIndex + 1}/${currentQuestions.length}
  </div>

  <h3>${q.question}</h3>

  `;

  q.answers.forEach((a, i) => {

    html += `

    <button onclick="selectAnswer(${i})">
    ${a}
    </button>

    `;

  });

  quizContainer.innerHTML = html;

}


function selectAnswer(index) {

  const correct = currentQuestions[currentIndex].correct;

  if (mode === "test") {

    if (index === correct)
      score++;

  }

}


function nextQuestion() {

  currentIndex++;

  if (currentIndex >= currentQuestions.length)
    finish();

  else
    showQuestion();

}


function finish() {

  resultBox.innerHTML = `

  Test dokončen

  ${score}/${currentQuestions.length}

  `;

}

