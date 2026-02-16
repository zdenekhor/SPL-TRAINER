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

  }

  catch (e) {

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

      const base = box.innerText.split("\n")[0];

      box.innerText = base +
        `\n👥 Online: ${online} | Celkem: ${total}`;

    }

  });

}

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

    if (!response.ok) {

      throw new Error("HTTP error " + response.status);

    }

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

  }

  catch (error) {

    console.warn("METAR error:", error);

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

    startStudy();

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

  if (!window.db) return;

  const snapshot = await window.fbGetDocs(
    window.fbCollection(window.db, "questionChanges")
  );

  snapshot.forEach(doc => {

    const d = doc.data();

    const key = d.category.trim() + "|" + d.question.trim();

    if (!changeLog[key]) changeLog[key] = [];

    changeLog[key].push(d);

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

  if (!data[category]) return;

  currentQuestions = data[category].map((q, i) => ({
    ...q,
    _originalIndex: i + 1
  }));

  currentIndex = 0;

  resultBox.innerHTML = "";


  if (mode === "test" && randomToggle?.checked)

    shuffle(currentQuestions);


  const limit = parseInt(questionLimitInput?.value);


  if (
    mode === "test" &&
    !isNaN(limit) &&
    limit > 0 &&
    limit < currentQuestions.length
  )

    currentQuestions = currentQuestions.slice(0, limit);

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

  <div><strong>Otázka ${currentIndex + 1} / ${currentQuestions.length} (původní #${q._originalIndex})</strong></div>

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

  <button onclick="prevQuestion()">⬅ Zpět</button>

  <button onclick="nextQuestion()">Další ➡</button>

  </div>

  `;


  quizContainer.innerHTML = html;


  if (mode === "study" || mode === "edit")

    highlightCorrect();

}


function highlightCorrect() {

  const correct = currentQuestions[currentIndex].correct;

  const buttons = document.querySelectorAll(".answerBtn");


  buttons.forEach((btn, i) => {

    btn.disabled = false;

    btn.style.backgroundColor = "#1f3a5f";


    if (i === correct)

      btn.style.backgroundColor = "var(--correctColor, #2e7d32)";

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

        btn.style.backgroundColor = "var(--correctColor, #2e7d32)";


      if (i === index && index !== correct)

        btn.style.backgroundColor = "var(--wrongColor, #b71c1c)";

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
  <div>
  Test dokončen<br>
  ${score} / ${total}<br>
  ${percent} %
  </div>
  `;

  await saveUserStats(score, total);
  await loadUserStats();

}
/* =========================
   USER STATISTICS
========================= */

async function saveUserStats(score, total) {

  try {

    if (!window.db) return;

    await window.fbAddDoc(
      window.fbCollection(window.db, "userStats"),
      {
        userId: userId,
        score: score,
        total: total,
        percent: Math.round((score / total) * 100),
        category: categorySelect.value,
        timestamp: Date.now()
      }
    );

  }
  catch (e) {

    console.error("Stat save error:", e);

  }

}


async function loadUserStats() {

  try {

  const statsBox = document.getElementById("userStats");

if (!statsBox) return;

// vyčistit bez textu
statsBox.innerHTML = "";


    if (!window.db) {

      statsBox.innerHTML = "Statistika není dostupná";
      return;

    }

    const snapshot = await window.fbGetDocs(
      window.fbCollection(window.db, "userStats")
    );

    let tests = 0;
    let totalQuestions = 0;
    let totalCorrect = 0;
    let best = 0;

    snapshot.forEach(doc => {

      const d = doc.data();

      if (d.userId === userId) {

        tests++;
        totalQuestions += d.total;
        totalCorrect += d.score;

        if (d.percent > best)
          best = d.percent;

      }

    });

    const avg = totalQuestions
      ? Math.round((totalCorrect / totalQuestions) * 100)
      : 0;

    statsBox.innerHTML = `
      Vaše statistika:<br>
      Testů: ${tests}<br>
      Celkem otázek: ${totalQuestions}<br>
      Úspěšnost: ${avg} %<br>
      Nejlepší výsledek: ${best} %
    `;

  }
  catch (e) {

    console.error("Stat load error:", e);

  }

}


