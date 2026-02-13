let currentQuestions = [];
let currentIndex = 0;
let score = 0;
let mode = "study";

const categorySelect = document.getElementById("categorySelect");
const quizContainer = document.getElementById("quizContainer");
const resultBox = document.getElementById("result");

// Naplnění výběru okruhů
function initCategories() {
    Object.keys(data).forEach(category => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
}

function startStudy() {
    mode = "study";
    startQuiz();
}

function startTest() {
    mode = "test";
    score = 0;
    startQuiz();
}

function startQuiz() {
    const selectedCategory = categorySelect.value;
    currentQuestions = [...data[selectedCategory]];
    currentIndex = 0;
    resultBox.innerHTML = "";
    showQuestion();
}

function showQuestion() {
    if (currentIndex >= currentQuestions.length) {
        finishQuiz();
        return;
    }

    const q = currentQuestions[currentIndex];

    quizContainer.innerHTML = `
        <h3>${q.question}</h3>
        ${q.answers.map((answer, i) =>
            `<button onclick="selectAnswer(${i})" style="display:block; margin:5px 0;">${answer}</button>`
        ).join("")}
    `;
}

function selectAnswer(index) {
    if (mode === "test") {
        // zatím bez vyhodnocení správnosti
        score++;
    }

    currentIndex++;
    showQuestion();
}

function finishQuiz() {
    quizContainer.innerHTML = "";

    if (mode === "test") {
        resultBox.innerHTML = `Test dokončen. Počet otázek: ${currentQuestions.length}`;
    } else {
        resultBox.innerHTML = "Studium dokončeno.";
    }
}

initCategories();
