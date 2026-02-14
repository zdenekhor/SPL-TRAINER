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

const categorySelect = document.getElementById("categorySelect");
const quizContainer = document.getElementById("quizContainer");
const resultBox = document.getElementById("result");

const randomToggle = document.getElementById("randomToggle");
const questionLimitInput = document.getElementById("questionLimit");

/* =========================
   NAČTENÍ DAT
========================= */

fetch("./data.json")
  .then(res => res.json())
  .then(json => {
    data = json;
    initCategories();
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

  let html = `
    <div><strong>Otázka ${currentIndex + 1} / ${currentQuestions.length}</strong></div>
    <h3>${q.question}</h3>
  `;

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

  // TEST režim
  if (mode === "test") {

    const correct = currentQuestions[currentIndex].correct;
    const buttons = document.querySelectorAll(".answerBtn");

    buttons.forEach((btn, i) => {
      btn.disabled = true;

      if (i === correct) {
        btn.style.backgroundColor = "var(--correctColor)";
      }

      if (i === index && i !== correct) {
        btn.style.backgroundColor = "var(--wrongColor)";
      }
    });

    if (index === correct) {
      score++;
    }

    return;
  }

  // EDIT režim
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

  const percent = Math.round((score / currentQuestions.length) * 100);

  resultBox.innerHTML = `
    <div style="margin-top:20px;font-weight:bold">
      Hotovo.<br>
      Správně: ${score} / ${currentQuestions.length}<br>
      Úspěšnost: ${percent} %
    </div>
  `;
}
