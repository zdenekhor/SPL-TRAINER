let data = {};

let currentQuestions = [];
let currentIndex = 0;
let score = 0;
let mode = "study";

const categorySelect = document.getElementById("categorySelect");
const quizContainer = document.getElementById("quizContainer");
const resultBox = document.getElementById("result");

fetch("data.json")
.then(r => r.json())
.then(json => {
    data = json;
    initCategories();
});

function initCategories(){
    categorySelect.innerHTML="";
    Object.keys(data).forEach(c=>{
        let o=document.createElement("option");
        o.value=c;
        o.textContent=c;
        categorySelect.appendChild(o);
    });
}

function startStudy(){ mode="study"; startQuiz(); }
function startTest(){ mode="test"; score=0; startQuiz(); }
function startEdit(){ mode="edit"; startQuiz(); }

function startQuiz(){
    currentQuestions=data[categorySelect.value];
    currentIndex=0;
    resultBox.innerHTML="";
    showQuestion();
}

function showQuestion(){

    if(currentIndex<0) currentIndex=0;
    if(currentIndex>=currentQuestions.length){
        finishQuiz();
        re
