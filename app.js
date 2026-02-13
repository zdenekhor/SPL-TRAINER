console.log("APP STARTED");

let data = {
  "Testovací okruh": [
    {
      question: "1. Testovací otázka?",
      answers: ["a) Ano", "b) Ne", "c) Možná"],
      correct: 0
    }
  ]
};

let currentQuestions = [];
let currentIndex = 0;
let mode = "study";

const categorySelect = document.getElementById("categorySelect");
const quizContainer = document.getElementById("quizContainer");

function initCategories(){
  categorySelect.innerHTML="";
  Object.keys(data).forEach(c=>{
    let o=document.createElement("option");
    o.value=c;
    o.textContent=c;
    categorySelect.appendChild(o);
  });
}

initCategories();

function startStudy(){
  currentQuestions=data[categorySelect.value];
  currentIndex=0;
  showQuestion();
}

function showQuestion(){
  let q=currentQuestions[currentIndex];
  quizContainer.innerHTML="<h3>"+q.question+"</h3>";
}

