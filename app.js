/* =========================
   SPL TRAINER – FINÁLNÍ VERZE
   Autor: Zdeněk Horák
========================= */


/* =========================
   GLOBÁLNÍ PROMĚNNÉ
========================= */

let data = {};
let currentQuestions = [];
let currentIndex = 0;
let score = 0;
let mode = "study";

const categorySelect = document.getElementById("categorySelect");
const quizContainer = document.getElementById("quizContainer");
const resultBox = document.getElementById("result");
const statsBox = document.getElementById("statsBox");

const randomToggle = document.getElementById("randomQuestions");
const questionLimitInput = document.getElementById("questionCount");


/* =========================
   IDENTITA UŽIVATELE
========================= */

function getUserId() {

  let id = localStorage.getItem("spl_user_id");

  if (!id) {

    id = crypto.randomUUID();

    localStorage.setItem("spl_user_id", id);

  }

  return id;

}

const userId = getUserId();


/* =========================
   FIREBASE PRESENCE
========================= */

async function setupPresence() {

  if (!window.rtdb) return;

  const ref = window.rtdbRef(window.rtdb, "presence/" + userId);

  await window.rtdbSet(ref, {

    online: true,
    lastSeen: Date.now()

  });

  window.rtdbOnDisconnect(ref).set({

    online: false,
    lastSeen: Date.now()

  });

}


function watchPresence() {

  if (!window.rtdb) return;

  const ref = window.rtdbRef(window.rtdb, "presence");

  window.rtdbOnValue(ref, snapshot => {

    let online = 0;
    let total = 0;

    snapshot.forEach(child => {

      total++;

      if (child.val().online) online++;

    });

    const metarBox = document.getElementById("metarBox");

    if (metarBox) {

      const base = metarBox.innerText.split("\n")[0];

      metarBox.innerText = base +
        `\n👥 Online: ${online} | Celkem: ${total}`;

    }

  });

}


/* =========================
   STATISTIKA – ULOŽENÍ
========================= */

async function saveStats(correct, total) {

  try {

    if (!window.rtdb) return;

    const ref = window.rtdbRef(window.rtdb, "stats/" + userId);

    const snapshot = await new Promise(resolve => {

      window.rtdbOnValue(ref, resolve, { onlyOnce: true });

    });

    let stats = snapshot.val();

    if (!stats) {

      stats = {

        totalTests: 0,
        totalCorrect: 0,
        totalQuestions: 0

      };

    }

    stats.totalTests++;
    stats.totalCorrect += correct;
    stats.totalQuestions += total;
    stats.lastTest = Date.now();

    await window.rtdbSet(ref, stats);

  }

  catch (e) {

    console.error("Statistika chyba", e);

  }

}


/* =========================
   STATISTIKA – NAČTENÍ
========================= */

function loadStats() {

  if (!window.rtdb) return;

  const ref = window.rtdbRef(window.rtdb, "stats/" + userId);

  window.rtdbOnValue(ref, snapshot => {

    if (!snapshot.exists()) {

      statsBox.innerHTML = "Vaše statistika: zatím žádná data";

      return;

    }

    const stats = snapshot.val();

    const percent = Math.round(
      (stats.totalCorrect / stats.totalQuestions) * 100
    );

    statsBox.innerHTML = `

      Vaše statistika:<br>
      Testů: ${stats.totalTests}<br>
      Úspěšnost: ${percent} %<br>
      Správně: ${stats.totalCorrect} / ${stats.totalQuestions}

    `;

  });

}


/* =========================
   NAČTENÍ OTÁZEK
========================= */

fetch("data.json")

  .then(r => r.json())

  .then(json => {

    data = json;

    initCategories();

    startStudy();

  });


/* =========================
   KATEGORIE
========================= */

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

  prepareQuestions();

  showQuestion();

}


function startEdit() {

  mode = "edit";

  prepareQuestions();

  showQuestion();

}


/* =========================
   PŘÍPRAVA OTÁZEK (OPRAVENO)
========================= */

function prepareQuestions() {

  const category = categorySelect.value;

  if (!data[category]) return;

  let questions = data[category].map((q, i) => ({

    ...q,
    _originalIndex: i + 1

  }));


  // náhodné pořadí

  if (randomToggle && randomToggle.checked) {

    for (let i = questions.length - 1; i > 0; i--) {

      const j = Math.floor(Math.random() * (i + 1));

      [questions[i], questions[j]] =
        [questions[j], questions[i]];

    }

  }


  // limit počtu

  if (questionLimitInput) {

    let limit = parseInt(questionLimitInput.value);

    if (!isNaN(limit) && limit > 0 && limit < questions.length)

      questions = questions.slice(0, limit);

  }


  currentQuestions = questions;

  currentIndex = 0;

  score = 0;

  resultBox.innerHTML = "";

}


/* =========================
   ZOBRAZENÍ OTÁZKY
========================= */

function showQuestion() {

  if (!currentQuestions.length) return;

  const q = currentQuestions[currentIndex];

  let html = `

  <div>
  Otázka ${currentIndex + 1} / ${currentQuestions.length}
  (původní #${q._originalIndex})
  </div>

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

  <div style="margin-top:10px;">
  <button onclick="prevQuestion()">← Zpět</button>
  <button onclick="nextQuestion()">Další →</button>
  </div>

  `;

  quizContainer.innerHTML = html;

}


/* =========================
   ODPOVĚĎ
========================= */

function selectAnswer(index) {

  const correct = currentQuestions[currentIndex].correct;

  if (mode === "test" && index === correct)

    score++;

}


/* =========================
   NAVIGACE
========================= */

function nextQuestion() {

  if (currentIndex < currentQuestions.length - 1) {

    currentIndex++;

    showQuestion();

  }

  else

    finish();

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

async function finish() {

  if (mode !== "test") return;

  const total = currentQuestions.length;

  const percent = Math.round((score / total) * 100);

  resultBox.innerHTML = `

  Test dokončen<br>
  ${score} / ${total}<br>
  ${percent} %

  `;

  await saveStats(score, total);

  loadStats();

}


/* =========================
   METAR
========================= */

async function loadMetar() {

  try {

    const r = await fetch(
      "https://corsproxy.io/?https://tgftp.nws.noaa.gov/data/observations/metar/stations/LKMT.TXT"
    );

    const text = await r.text();

    const lines = text.split("\n");

    document.getElementById("metarBox").innerText = lines[1];

  }

  catch {}

}


/* =========================
   START APLIKACE
========================= */

window.addEventListener("load", () => {

  setupPresence();

  watchPresence();

  loadStats();

  loadMetar();

});
