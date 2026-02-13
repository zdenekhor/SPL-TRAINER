let data = {
  "Letecké předpisy": []
};

// Dočasně jen test – ověříme, že kód běží

let currentQuestions = [];
let currentIndex = 0;
let score = 0;
let mode = "study";

const categorySelect = document.getElementById("categorySelect");
const quizContainer = document.getElementById("quizContainer");
const resultBox = document.getElementById("result");

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
    alert("Kód běží správně.");
}
