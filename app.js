console.log("APP READY");

let data = {};
let currentQuestions = [];
let currentIndex = 0;
let score = 0;
let mode = "study";

const categorySelect = document.getElementById("categorySelect");
const quizContainer = document.getElementById("quizContainer");
const resultBox = document.getElementById("result");

fetch("./data.json")
.then(response => response.json())
.then(json => {
    data = json;
    initCategories();
})
.catch(err => {
    console.error("Chyba načtení data.json:", err);
});

function initCategories(){
    categorySelect.innerHTML = "";
    Object.keys(data).forEach(cat=>{
        let option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });
}

function startStudy(){
    mode = "study";
    startQuiz();
}

function startTest(){
    mode = "test";
    score = 0;
    startQuiz();
}

function startEdit(){
    mode = "edit";
    startQuiz();
}

function startQuiz(){
    currentQuestions = data[categorySelect.value];
    currentIndex = 0;
    resultBox.innerHTML = "";
    showQuestion();
}

function showQuestion(){

    if(!currentQuestions || currentQuestions.length === 0) return;

    let q = currentQuestions[currentIndex];

    let html = "<div><strong>Otázka "
        + (currentIndex+1) + " / " + currentQuestions.length + "</strong></div>";

    html += "<h3>" + q.question + "</h3>";

    q.answers.forEach((ans,i)=>{
        html += "<button onclick='selectAnswer("+i+")' \
        style='display:block;width:100%;margin:6px 0;padding:10px;border-radius:6px;border:none;background:#1
