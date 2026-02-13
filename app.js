console.log("APP READY");

let data = {};
let currentQuestions = [];
let currentIndex = 0;
let score = 0;
let mode = "study";

const categorySelect = document.getElementById("categorySelect");
const quizContainer = document.getElementById("quizContainer");
const resultBox = document.getElementById("result");

// Načtení dat
fetch("data.json")
.then(res => res.json())
.then(json => {
    data = json;
    initCategories();
});

function initCategories(){
    categorySelect.innerHTML = "";
    Object.keys(data).forEach(cat => {
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
    currentQuestions = data

}
