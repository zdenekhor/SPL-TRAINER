// ===============================
// DATA – IMPORTOVANÁ Z EXCELU
// ===============================

let data = JSON.parse(localStorage.getItem("quizData")) || {
"Letecké předpisy": [
{
question: "1. Definice dohlednosti zní",
answers: [
"dohlednost dopředu z kabiny letadla za letu",
"schopnost vidět a rozeznávat význačné neosvětlené předměty ve dne a světla v noci, daná meteorologickými podmínkami a vyjádřená v jednotkách délkové míry",
"schopnost vidět a rozeznávat význačné neosvětlené předměty ve dne a světla v noci z kabiny letadla za letu"
],
correct: 1
},
{
question: "2. Hladina je",
answers: [
"výraz vyjadřující pouze hladinu atmosférického tlaku vztažený ke stanovenému tlakovému údaji 1013,2 hPa",
"výraz vyjadřující pouze hladinu atmosférického tlaku vztažený k hladině moře",
"všeobecný výraz používaný k vyjádření vertikální polohy letadla"
],
correct: 2
}
]
};

// ===============================
// PROMĚNNÉ
// ===============================

let currentQuestions = [];
let currentIndex = 0;
let score = 0;
let mode = "study";

const categorySelect = document.getElementById("categorySelect");
const quizContainer = document.getElementById("quizContainer");
const resultBox = document.getElementById("result");

// ===============================
// INIT
// ===============================

function initCategories() {
categorySelect.innerHTML = "";
Object.keys(data).forEach(category => {
const option = document.createElement("option");
option.value = category;
option.textContent = category;
categorySelect.appendChild(option);
});
}

initCategories();

// ===============================
// START FUNKCE
// ===============================

function startStudy() {
mode = "study";
startQuiz();
}

function startTest() {
mode = "test";
score = 0;
startQuiz();
}

function startEdit() {
mode = "edit";
startQuiz();
}

function startQuiz() {
const selectedCategory = categorySelect.value;
currentQuestions = data[selectedCategory];
currentIndex = 0;
resultBox.innerHTML = "";
showQuestion();
}

// ===============================
// ZOBRAZENÍ OTÁZKY
// ===============================

function showQuestion() {

if (currentIndex >= currentQuestions.length) {
finishQuiz();
return;
}

const q = currentQuestions[currentIndex];

quizContainer.innerHTML = `
<h3 style="font-size:18px;">${q.question}</h3>
${q.answers.map((a,i)=>`
<button onclick="selectAnswer(${i})"
style="
display:block;
width:100%;
margin:8px 0;
padding:14px;
font-size:16px;
border-radius:10px;
border:none;
background:#1f3a5f;
color:white;
">
${a}
</button>
`).join("")}
`;

highlightCorrect();
}

// ===============================
// VÝBĚR ODPOVĚDI
// ===============================

function selectAnswer(index){

const correctIndex = currentQuestions[currentIndex].correct;

if(mode === "edit"){
currentQuestions[currentIndex].correct = index;
saveData();
showQuestion();
return;
}

if(mode === "test"){
if(index === correctIndex){
score++;
}
highlightSelection(correctIndex,index);
setTimeout(()=>{nextQuestion();},700);
}else{
nextQuestion();
}
}

function nextQuestion(){
currentIndex++;
showQuestion();
}

// ===============================
// ZVÝRAZNĚNÍ
// ===============================

function highlightCorrect(){
if(mode !== "edit") return;
const buttons = quizContainer.querySelectorAll("button");
buttons.forEach((btn,i)=>{
if(i === currentQuestions[currentIndex].correct){
btn.style.background = "#2ecc71";
}
});
}

function highlightSelection(correct,selected){
const buttons = quizContainer.querySelectorAll("button");
buttons.forEach((btn,i)=>{
btn.disabled = true;
if(i === correct){
btn.style.background = "#2ecc71";
}
if(i === selected && i !== correct){
btn.style.background = "#e74c3c";
}
});
}

// ===============================
// ULOŽENÍ
// ===============================

function saveData(){
localStorage.setItem("quizData",JSON.stringify(data));
}

// ===============================
// KONEC TESTU
// ===============================

function finishQuiz(){
quizContainer.innerHTML = "";
if(mode === "test"){
resultBox.innerHTML = `
Hotovo.<br>
Správně: ${score} / ${currentQuestions.length}<br>
Úspěšnost: ${Math.round((score/currentQuestions.length)*100)} %
`;
}else if(mode === "edit"){
resultBox.innerHTML = "Režim úprav dokončen.";
}else{
resultBox.innerHTML = "Studium dokončeno.";
}
}
