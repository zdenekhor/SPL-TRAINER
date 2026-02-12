let questionStatus = JSON.parse(localStorage.getItem("questionStatus")) || {};
let correctAnswers = JSON.parse(localStorage.getItem("correctAnswers")) || {};

let filteredQuestions = [];
let questions = [];
let currentIndex = 0;
let mode = "";

/* ====== DATA ====== */
/* ZDE vložte celý svůj blok const data = {...}; */
/* Nechte přesně tak jak ho máte */

const data = {
"Letecké předpisy": [
{
question: "1. Definice dohlednosti zní",
answers: [
"a) dohlednost dopředu z kabiny letadla za letu",
"b) schopnost vidět a rozeznávat význačné neosvětlené předměty ve dne a světla v noci, daná meteorologickými podmínkami a vyjádřená v jednotkách délkové míry",
"c) schopnost vidět a rozeznávat význačné neosvětlené předměty ve dne a světla v noci z kabiny letadla za letu"
]
}
]
};

/* ====== INIT ====== */

window.onload = function () {
populateCategories();
};

/* ====== KATEGORIE ====== */

function populateCategories() {
const select = document.getElementById("categorySelect");
select.innerHTML = "";

for (let category in data) {
let option = document.createElement("option");
option.value = category;
option.textContent = category;
select.appendChild(option);
}
}

/* ====== START ====== */

function startStudy() {
startMode("study");
}

function startTest() {
startMode("test");
}

function startEdit() {
startMode("edit");
}

function startMode(selectedMode) {

mode = selectedMode;
currentIndex = 0;

const category = document.getElementById("categorySelect").value;
questions = data[category] || [];
filteredQuestions = [...questions];

document.getElementById("menu").classList.add("hidden");
document.getElementById("app").classList.remove("hidden");

showQuestion();
}

/* ====== ZOBRAZENÍ OTÁZKY ====== */

function showQuestion() {

if (filteredQuestions.length === 0) {
document.getElementById("questionBox").textContent = "Žádné otázky.";
return;
}

const q = filteredQuestions[currentIndex];

document.getElementById("progress").textContent =
"Otázka " + (currentIndex + 1) + " / " + filteredQuestions.length;

document.getElementById("questionBox").textContent = q.question;

const answersBox = document.getElementById("answersBox");
answersBox.innerHTML = "";

q.answers.forEach((a, i) => {
let btn = document.createElement("button");
btn.textContent = a;

if (mode === "edit") {
btn.onclick = () => setCorrect(i);
if (correctAnswers[q.question] === i) {
btn.classList.add("selected");
}
} else {
btn.onclick = () => selectAnswer(i);
}

answersBox.appendChild(btn);
});
}

/* ====== ODPOVĚĎ ====== */

function selectAnswer(index) {
const q = filteredQuestions[currentIndex];

questionStatus[q.question] = index;
localStorage.setItem("questionStatus", JSON.stringify(questionStatus));

nextQuestion();
}

function setCorrect(index) {
const q = filteredQuestions[currentIndex];

correctAnswers[q.question] = index;
localStorage.setItem("correctAnswers", JSON.stringify(correctAnswers));

showQuestion();
}

/* ====== NAVIGACE ====== */

function nextQuestion() {
if (currentIndex < filteredQuestions.length - 1) {
currentIndex++;
showQuestion();
}
}

function goBack() {
if (currentIndex > 0) {
currentIndex--;
showQuestion();
}
}

/* ====== FILTR ====== */

function markKnown() {
const q = filteredQuestions[currentIndex];
questionStatus[q.question] = "known";
localStorage.setItem("questionStatus", JSON.stringify(questionStatus));
}

function markUnknown() {
const q = filteredQuestions[currentIndex];
questionStatus[q.question] = "unknown";
localStorage.setItem("questionStatus", JSON.stringify(questionStatus));
}

function applyFilter() {
const filter = document.getElementById("filterSelect").value;
const category = document.getElementById("categorySelect").value;
questions = data[category];

if (filter === "all") {
filteredQuestions = [...questions];
} else {
filteredQuestions = questions.filter(q =>
questionStatus[q.question] === filter
);
}

currentIndex = 0;
showQuestion();
}
