let questionStatus = JSON.parse(localStorage.getItem("questionStatus")) || {};
let correctAnswers = JSON.parse(localStorage.getItem("correctAnswers")) || {};
let filteredQuestions = [];
let questions = [];
let currentIndex = 0;
let mode = "";

/* ===== DATA ===== */

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

/* ===== INIT ===== */

window.onload = function () {
  populateCategories();
};

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

function startStudy() { startMode("study"); }
function startTest() { startMode("test"); }
function startEdit() { startMode("edit"); }

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

  q.answers.forEach((a) => {
    let btn = document.createElement("button");
    btn.textContent = a;
    answersBox.appendChild(btn);
  });
}
