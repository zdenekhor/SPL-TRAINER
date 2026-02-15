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


/* =========================
   DOM
========================= */

const categorySelect = document.getElementById("categorySelect");
const quizContainer = document.getElementById("quizContainer");
const resultBox = document.getElementById("result") || { innerHTML: "" };

const randomToggle = document.getElementById("randomQuestions");
const questionLimitInput = document.getElementById("questionCount");

const correctColorPicker = document.getElementById("correctColorPicker");
const wrongColorPicker = document.getElementById("wrongColorPicker");
const settingsToggle = document.getElementById("settingsToggle");
const settingsPanel = document.getElementById("settingsPanel");


/* =========================
   NASTAVENÍ PANEL
========================= */

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

    startStudy(); // automatické spuštění

  });


/* =========================
   INICIALIZACE OKRUHŮ
========================= */

function initCategories() {

  categorySelect.innerHTML = "";

  Object.keys(data).forEach(cat => {

    const option = document.createElement("option");

    option.value = cat;
    option.textContent = cat;

    categorySelect.appendChild(option);

  });


  // KLÍČOVÁ OPRAVA – přepínání okruhů
  categorySelect.addEventListener("change", () => {

    if (mode === "study") startStudy();
    if (mode === "test") startTest();
    if (mode === "edit") startEdit();

  });

}


/* =========================
   CHANGELOG
========================= */

async function loadChangeLog() {

  if (!window.db) {

    console.warn("Firebase není připraven");
    return;

  }

  const snapshot = await window.fbGetDocs(
    window.fbCollection(window.db, "questionChanges")
  );

  snapshot.forEach(doc => {

    const d = doc.data();

    const key =
      d.category.trim() + "|" +
      d.question.trim();

    if (!changeLog[key]) {
      changeLog[key] = [];
    }

    changeLog[key].push(d);

  });

  console.log("ChangeLog načten");

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

  wrongQuestions = [];

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

  const category = categorySelect.value;

  if (!data[category]) {

    console.error("Kategorie nenalezena:", category);
    return;

  }

  currentQuestions = [...data[category]];

  currentIndex = 0;

  resultBox.innerHTML = "";


  if (mode === "test" && randomToggle?.checked) {

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

  const key =
    categorySelect.value.trim() + "|" +
    q.question.trim();

  const changes = changeLog[key];


  let html = `
    <div><strong>Otázka ${currentIndex + 1} / ${currentQuestions.length}</strong></div>
    <h3>${q.question}</h3>
  `;


  if (changes && changes.length > 0) {

    const last = changes[changes.length - 1];

    const date = new Date(last.timestamp);

    html += `
      <div style="
        font-size:12px;
        color:#ffd166;
        margin-bottom:10px;
        padding:6px;
        border-left:3px solid #ffd166;
      ">
        📝 Změněno:
        ${date.toLocaleDateString()}
        ${date.toLocaleTimeString()}
      </div>
    `;

  }


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

      btn.style.backgroundColor =
        "var(--correctColor, #2e7d32)";

    }

  });

}


/* =========================
   ODPOVĚĎ
========================= */

function selectAnswer(index) {

  const correct = currentQuestions[currentIndex].correct;

  const buttons = document.querySelectorAll(".answerBtn");


  if (mode === "test") {

    buttons.forEach((btn, i) => {

      btn.disabled = true;

      if (i === correct)
        btn.style.backgroundColor =
          "var(--correctColor, #2e7d32)";

      if (i === index && index !== correct)
        btn.style.backgroundColor =
          "var(--wrongColor, #b71c1c)";

    });

    if (index === correct)
      score++;
    else
      wrongQuestions.push(currentQuestions[currentIndex]);

  }


  if (mode === "edit") {

    const q = currentQuestions[currentIndex];

    const oldCorrect = q.correct;

    if (oldCorrect !== index) {

      q.correct = index;

      if (window.db) {

        window.fbAddDoc(
          window.fbCollection(window.db, "questionChanges"),
          {
            category: categorySelect.value.trim(),
            question: q.question.trim(),
            oldCorrect,
            newCorrect: index,
            timestamp: Date.now()
          }
        );

      }

    }

    highlightCorrect();

  }

}


/* =========================
   NAVIGACE
========================= */

function nextQuestion() {

  if (currentIndex < currentQuestions.length - 1) {

    currentIndex++;

    showQuestion();

  }

  else {

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
   KONEC TESTU
========================= */

function finish() {

  if (mode !== "test") return;

  const total = currentQuestions.length;

  const percent =
    Math.round((score / total) * 100);


  resultBox.innerHTML = `
    <div>
      Test dokončen<br>
      ${score} / ${total}<br>
      ${percent} %
    </div>
  `;

}
