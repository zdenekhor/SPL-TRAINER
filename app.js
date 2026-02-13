console.log("APP STABLE");

let data = {
  "Test": [
    {
      question: "Funguje?",
      answers: ["Ano","Ne","Mozna"],
      correct: 0
    }
  ]
};

let currentQuestions = [];
let currentIndex = 0;

const categorySelect = document.getElementById("categorySelect");
const quizContainer = document.getElementById("quizContainer");

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
  currentQuestions = data[categorySelect.value];
  currentIndex = 0;
  showQuestion();
}

function startTest(){ startStudy(); }
function startEdit(){ startStudy(); }

function showQuestion(){
  let q = currentQuestions[currentIndex];
  let html = "<h3>"+q.question+"</h3>";
  q.answers.forEach((a,i)=>{
    html += "<button>"+a+"</button><br>";
  });
  quizContainer.innerHTML = html;
}

