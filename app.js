console.log("APP OK");

let data = {
  "Testovací okruh": [
    {
      question: "1. Funguje aplikace?",
      answers: ["a) Ano", "b) Ne", "c) Možná"],
      correct: 0
    }
  ]
};

let currentQuestions = [];
let currentIndex = 0;
let score = 0;
let mode = "study";

const categorySelect = document.getElementById("categorySelect");
const quizContainer = document.getElementById("quizContainer");
const resultBox = document.getElementById("result");

function initCategories(){
  categorySelect.innerHTML = "";
  Object.keys(data).forEach(cat=>{
    let option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });
}

initCategories();

function startStudy(){
  mode = "study";
  currentQuestions = data[categorySelect.value];
  currentIndex = 0;
  showQuestion();
}

function startTest(){
  mode = "test";
  score = 0;
  currentQuestions = data[categorySelect.value];
  currentIndex = 0;
  showQuestion();
}

function startEdit(){
  mode = "edit";
  currentQuestions = data[categorySelect.value];
  currentIndex = 0;
  showQuestion();
}

function showQuestion(){
  let q = currentQuestions[currentIndex];

  let html = "<h3>" + q.question + "</h3>";

  q.answers.forEach((ans,i)=>{
    html += "<button onclick='selectAnswer("+i+")'>" + ans + "</button><br>";
  });

  quizContainer.innerHTML = html;
}

function selectAnswer(i){
  alert("Klikl jste odpověď " + (i+1));
}
