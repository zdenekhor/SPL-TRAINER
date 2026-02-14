console.log("SPL READY");
/* =========================
   METAR GENERATOR
========================= */
async function loadMetar() {
  try {

    const response = await fetch(
      "https://tgftp.nws.noaa.gov/data/observations/metar/stations/LKMT.TXT"
    );

    if (!response.ok) {
      throw new Error("HTTP error " + response.status);
    }

    const text = await response.text();

    const lines = text.trim().split("\n");

    // Druhý řádek obsahuje samotný METAR
    const metar = lines[1] || "METAR není dostupný";

    document.getElementById("metarBox").innerText = metar;

  } catch (error) {
    document.getElementById("metarBox").innerText = "Chyba načítání METAR";
    console.error("METAR error:", error);
  }
}


loadMetar();
setInterval(loadMetar, 30 000);
// ==========================
// GLOBÁLNÍ STAV
// ==========================

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

// ==========================
// BAREVNÝ SYSTÉM
// ==========================

const correctPicker = document.getElementById("correctColor");
const wrongPicker = document.getElementById("wrongColor");

function applyColors() {
    document.documentElement.style.setProperty("--correctColor", correctPicker.value);
    document.documentElement.style.setProperty("--wrongColor", wrongPicker.value);
}

function loadColors() {
    const savedCorrect = localStorage.getItem("correctColor");
    const savedWrong = localStorage.getItem("wrongColor");

    if (savedCorrect) correctPicker.value = savedCorrect;
    if (savedWrong) wrongPicker.value = savedWrong;

    applyColors();
}

correctPicker.addEventListener("input", () => {
    localStorage.setItem("correctColor", correctPicker.value);
    applyColors();
});

wrongPicker.addEventListener("input", () => {
    localStorage.setItem("wrongColor", wrongPicker.value);
    applyColors();
});

loadColors();

// ==========================
// NAČTENÍ DAT
// ==========================

fetch("./data.json")
    .then(res => res.json())
    .then(async json => {

        data = json;

        // načíst opravy z Firestore
        if (window.db) {

            const snapshot = await window.fbGetDocs(
                window.fbCollection(window.db, "corrections")
            );

            snapshot.forEach(doc => {
                const c = doc.data();

                if (data[c.category] && data[c.category][c.questionIndex]) {
                    data[c.category][c.questionIndex].correct = c.correct;
                }
            });
        }

        initCategories();
    });


// ==========================
// KATEGORIE
// ==========================

function initCategories() {
    categorySelect.innerHTML = "";
    Object.keys(data).forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });
}

// ==========================
// START MÓDY
// ==========================

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


// ==========================
// PŘÍPRAVA OTÁZEK
// ==========================

function prepareQuestions() {
    currentQuestions = [...data[categorySelect.value]];
    currentIndex = 0;
    resultBox.innerHTML = "";

    // náhodné pořadí
    if (mode === "test" && randomToggle.checked) {
        shuffle(currentQuestions);
    }

    // omezení počtu
    const limit = parseInt(questionLimitInput.value);

    if (
        mode === "test" &&
        !isNaN(limit) &&
        limit > 0 &&
        limit < currentQuestions.length
    ) {
        currentQuestions = currentQuestions.slice(0, limit);
    }
}

// ==========================
// SHUFFLE (Fisher-Yates)
// ==========================

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// ==========================
// ZOBRAZENÍ OTÁZKY
// ==========================

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
    
// ==========================
// ZVÝRAZNĚNÍ SPRÁVNÉ ODPOVĚDI
// ==========================

function highlightCorrect() {

    const correct = currentQuestions[currentIndex].correct;
    const buttons = document.querySelectorAll(".answerBtn");

    buttons.forEach((btn, i) => {

        // reset výchozí barvy
        btn.style.backgroundColor = "#1f3a5f";
        btn.disabled = false;

        if (i === correct) {
            btn.style.backgroundColor = "var(--correctColor)";
        }
    });
}

// ==========================
// VÝBĚR ODPOVĚDI
// ==========================

function selectAnswer(index) {

    // ===== TEST režim =====
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

    // ===== EDIT režim =====
    if (mode === "edit") {

        const previous = currentQuestions[currentIndex].correct;
        currentQuestions[currentIndex].correct = index;

        if (window.db) {

            const logData = {
                category: categorySelect.value,
                questionIndex: currentIndex,
                questionText: currentQuestions[currentIndex].question,
                previousCorrect: previous,
                newCorrect: index,
                answers: currentQuestions[currentIndex].answers,
                timestamp: Date.now()
            };

            window.fbAddDoc(
                window.fbCollection(window.db, "corrections"),
                {
                    category: categorySelect.value,
                    questionIndex: currentIndex,
                    correct: index,
                    timestamp: Date.now()
                }
            );

            window.fbAddDoc(
                window.fbCollection(window.db, "corrections_log"),
                logData
            );
        }

        highlightCorrect();
        return;
    }
}


// ==========================
// HISTORIE ZMĚN OTÁZKY
// ==========================

async function showHistory() {

    if (!window.db) {
        alert("Databáze není dostupná.");
        return;
    }

    const category = categorySelect.value;
    const qIndex = currentIndex;

    const snapshot = await window.fbGetDocs(
        window.fbCollection(window.db, "corrections_log")
    );

    let history = [];

    snapshot.forEach(doc => {
        const d = doc.data();

        if (d.category === category && d.questionIndex === qIndex) {
            history.push(d);
        }
    });

    history.sort((a, b) => b.timestamp - a.timestamp);

    let text = "Historie změn:\n\n";

    if (history.length === 0) {
        text += "Žádné změny pro tuto otázku.";
    } else {

        history.forEach(h => {

            const date = new Date(h.timestamp).toLocaleString();

            text += date + "\n";
            text += "Otázka: " + h.questionText + "\n";

            if (h.previousCorrect !== undefined && h.newCorrect !== undefined) {
                text += "Změna: " + h.previousCorrect + " → " + h.newCorrect + "\n\n";
            } else {
                text += "Neznámý formát záznamu\n\n";
            }

        });
    }

    alert(text);
}

// ==========================
// NAVIGACE
// ==========================

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

// ==========================
// UKONČENÍ TESTU
// ==========================

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
