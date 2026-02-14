console.log("SPL READY");

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
    .then(json => {
        data = json;
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
            <button onclick="selectAnswer(${i})" id="ans_${i}">
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

    if (mode === "study") highlightCorrect();
}

// ==========================
// VÝBĚR ODPOVĚDI
// ==========================

function selectAnswer(index) {
    const correct = currentQuestions[currentIndex].correct;
    const buttons = quizContainer.querySelectorAll("button");

    buttons.forEach((btn, i) => {
        btn.disabled = true;

        if (i === correct) {
            btn.style.backgroundColor = "var(--correctColor)";
        }

        if (mode === "test" && i === index && i !== correct) {
            btn.style.backgroundColor = "var(--wrongColor)";
        }
    });

    if (mode === "test" && index === correct) score++;

    if (mode === "test") {
        setTimeout(nextQuestion, 700);
    }
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
