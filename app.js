console.log("SPL READY");

/* =========================
   METAR
========================= */
async function loadMetar() {
  try {

    const response = await fetch(
      "https://corsproxy.io/?https://tgftp.nws.noaa.gov/data/observations/metar/stations/LKMT.TXT"
    );

    if (!response.ok) {
      throw new Error("HTTP error " + response.status);
    }

    const text = await response.text();
    const lines = text.trim().split("\n");
    const metar = lines[1] || "METAR není dostupný";

    const box = document.getElementById("metarBox");
    if (box) box.innerText = metar;

  } catch (error) {
    console.warn("METAR error:", error);
    const box = document.getElementById("metarBox");
    if (box) box.innerText = "METAR nedostupný";
  }
}

loadMetar();
setInterval(loadMetar, 300000);

/* =========================
   GLOBÁLNÍ STAV
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
      settingsPanel.style.display === "none" ? "block" : "none";
  });
}


if (correctColorPicker) {
  correctColorPicker.addEventListener("input", (e) => {
    document.documentElement.style.setProperty(
      "--correctColor",
      e.target.value
    );
  });
}

if (wrongColorPicker) {
  wrongColorPicker.addEventListener("input", (e) => {
    document.documentElement.style.setProperty(
      "--wrongColor",
      e.target.value
    );
  });
}


/* =========================
   NAČTENÍ DAT
========================= */

fetch("./data.json")
  .then(res => res.json())
.then(async json => {
  data = json;
  initCategories();
  await loadChangeLog();
});



function initCategories() {
  categorySelect.innerHTML = "";
  Object.keys(data).forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });
}
/* =========================
   NAČTENÍ HISTORIE ZMĚN Z FIREBASE
========================= */

async function loadChangeLog() {

  console.log("Načítám changeLog...");   // ← PŘIDAT SEM

  if (!window.db) {
    console.warn("Firebase není připraven");
    return;
  }

  const snapshot = await window.fbGetDocs(
    window.fbCollection(window.db, "questionChanges")
  );

  snapshot.forEach(doc => {

    const d = doc.data();

    const key = d.category + "|" + d.question;

    if (!changeLog[key]) {
      changeLog[key] = [];
    }

    changeLog[key].push(d);

  });

  console.log("ChangeLog načten:", changeLog);  // ← A SEM

}


/* =========================
   REŽIMY
========================= */

function startStudy() {
  mode = "study";
  prepareQuestions();
  showQuestion();
}

function startTest() {
  mode = "test";
  score = 0;
   wrongQuestions = []; // přidat toto
  prepareQuestions();
  showQuestion();
}

function startEdit() {
  mode = "edit";
  prepareQuestions();
  showQuestion();
}

/* =========================
   PŘÍPRAVA OTÁZEK
========================= */

function prepareQuestions() {
  currentQuestions = [...data[categorySelect.value]];
  currentIndex = 0;
  resultBox.innerHTML = "";

  if (mode === "test" && randomToggle && randomToggle.checked) {
    shuffle(currentQuestions);
  }

  const limit = parseInt(questionLimitInput?.value);

  if (
    mode === "test" &&
    !isNaN(limit) &&
    limit > 0 &&
    limit < currentQuestions.length
  ) {
    currentQuestions = currentQuestions.slice(0, limit);
  }
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/* =========================
   ZOBRAZENÍ OTÁZKY
========================= */

function showQuestion() {
  if (!currentQuestions.length) return;

 const q = currentQuestions[currentIndex];

const key = categorySelect.value + "|" + q.question;
const changes = changeLog[key];

let html = `
  <div><strong>Otázka ${currentIndex + 1} / ${currentQuestions.length}</strong></div>
  <h3>${q.question}</h3>
`;

if (changes && changes.length > 0) {

  q.answers.forEach((a, i) => {
  html += `
    <button class="answerBtn" onclick="selectAnswer(${i})">
      ${a}
    </button>
  `;
});

html += `
  <div style="margin-top:10px;display:flex;gap:8px;">
    <button onclick="prevQuestion()">⬅ Zpět</button>
    <button onclick="nextQuestion()">Další ➡</button>
  </div>
`;

quizContainer.innerHTML = html;

if (mode === "study" || mode === "edit") {
  highlightCorrect();
}

}


/* =========================
   ZVÝRAZNĚNÍ
========================= */

function highlightCorrect() {
  const correct = currentQuestions[currentIndex].correct;
  const buttons = document.querySelectorAll(".answerBtn");

  buttons.forEach((btn, i) => {
    btn.style.backgroundColor = "#1f3a5f";
    btn.disabled = false;

    if (i === correct) {
      btn.style.backgroundColor = "var(--correctColor)";
    }
  });
}

/* =========================
   VÝBĚR ODPOVĚDI
========================= */

function selectAnswer(index) {

  if (mode === "test") {

    const correct = currentQuestions[currentIndex].correct;
    const buttons = document.querySelectorAll(".answerBtn");

    buttons.forEach((btn, i) => {

      btn.disabled = true;

      if (i === correct) {
        btn.style.backgroundColor = "var(--correctColor)";
      }

      if (i === index && index !== correct) {
        btn.style.backgroundColor = "var(--wrongColor)";
      }

    });

    if (index === correct) {
      score++;
    } else {
      wrongQuestions.push(currentQuestions[currentIndex]);
    }

    return;
  }

  if (mode === "edit") {

    currentQuestions[currentIndex].correct = index;
    highlightCorrect();
    return;
  }
}

/* =========================
   NAVIGACE
========================= */

function nextQuestion() {

  if (currentIndex < currentQuestions.length - 1) {

    currentIndex++;
    showQuestion();

  } else {

    finish();

  }

}

function prevQuestion() {
  if (currentIndex > 0) {
    currentIndex--;
    showQuestion();
  }
}

/* =========================
   UKONČENÍ TESTU
========================= */

function finish() {
  if (mode !== "test") return;

  const total = currentQuestions.length;
  const percent = Math.round((score / total) * 100);

  let buttonHtml = "";

  if (wrongQuestions.length > 0) {
    buttonHtml = `
      <button onclick="repeatWrong()" style="
        margin-top:15px;
        padding:10px 15px;
        border-radius:6px;
        border:none;
        background:#2c5282;
        color:white;
        cursor:pointer;
      ">
        Opakovat špatné otázky (${wrongQuestions.length})
      </button>
    `;
  }

  resultBox.innerHTML = `
    <div style="padding:15px;border:1px solid #ccc;border-radius:8px;">
      <strong>Test dokončen</strong><br>
      Správně: ${score} / ${total}<br>
      Úspěšnost: ${percent} %
      ${buttonHtml}
    </div>
  `;
}
function repeatWrong() {

  if (wrongQuestions.length === 0) {
    alert("Žádné špatné otázky.");
    return;
  }

  currentQuestions = [...wrongQuestions];
  wrongQuestions = [];

  currentIndex = 0;
  score = 0;
  mode = "test";

  resultBox.innerHTML = "";

  showQuestion();
}


