console.log("SPL READY");

/* =========================
   METAR GENERATOR
========================= */

function generateMetar() {
  const airports = ["LKMT", "LKPR", "LKTB", "LKNA"];
  const windDir = Math.floor(Math.random() * 36) * 10;
  const windSpeed = Math.floor(Math.random() * 20) + 1;
  const visibility = ["9999", "8000", "6000", "4000"];
  const clouds = ["FEW020", "SCT030", "BKN040", "OVC050"];
  const temp = Math.floor(Math.random() * 25) - 5;
  const dew = temp - Math.floor(Math.random() * 5);
  const qnh = 980 + Math.floor(Math.random() * 40);

  const metar =
    airports[Math.floor(Math.random() * airports.length)] +
    " 131000Z " +
    windDir.toString().padStart(3, "0") +
    windSpeed +
    "KT " +
    visibility[Math.floor(Math.random() * visibility.length)] +
    " " +
    clouds[Math.floor(Math.random() * clouds.length)] +
    " " +
    temp +
    "/" +
    dew +
    " Q" +
    qnh;

  document.getElementById("metarBox").innerText = metar;
}

generateMetar();

/* =========================
   QUIZ LOGIC
========================= */

let data = {};
let currentQuestions = [];
let currentIndex = 0;
let score = 0;
let mode = "study";

const categorySelect = document.getElementById("categorySelect");
const quizContainer = document.getElementById("quizContainer");
const resultBox = document.getElementById("result");

fetch("./data.json")
  .then(res => res.json())
  .then(json => {
    data = json;
    initCategories();
  })
  .catch(err => console.error("JSON error:", err));

function initCategories(){
  categorySelect.innerHTML = "";
  Object.keys(data).forEach(cat=>{
    let option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });
}

function startStudy(){ mode="study"; startQuiz(); }
function startTest(){ mode="test"; score=0; startQuiz(); }
function startEdit(){ mode="edit"; startQuiz(); }

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

  q.answers.forEach((a,i)=>{
    html += "<button onclick='selectAnswer("+i+")' \
    style='display:block;width:100%;margin:6px 0;padding:10px;border:none;border-radius:6px;background:#1f3a5f;color:white;' \
    id='ans_"+i+"'>" + a + "</button>";
  });

  html += "<div style='margin-top:10px;display:flex;gap:8px;'>";
  html += "<button onclick='prevQuestion()'>⬅ Zpět</button>";
  html += "<button onclick='nextQuestion()'>Další ➡</button>";
  html += "</div>";

  quizContainer.innerHTML = html;

  if(mode === "study"){
    highlightCorrect();
  }

  if(mode === "edit"){
    highlightCorrect();
  }
}

function selectAnswer(i){
  let correct = currentQuestions[currentIndex].correct;

  if(mode === "edit"){
    currentQuestions[currentIndex].correct = i;
    highlightCorrect();
    return;
  }

  if(mode === "test"){
    if(i === correct) score++;
    highlightSelection(correct,i);
    setTimeout(nextQuestion,600);
  }
}

function nextQuestion(){
  if(currentIndex < currentQuestions.length-1){
    currentIndex++;
    showQuestion();
  } else {
    finishQuiz();
  }
}

function prevQuestion(){
  if(currentIndex > 0){
    currentIndex--;
    showQuestion();
  }
}

function highlightCorrect(){
  let buttons = quizContainer.querySelectorAll("button");
  buttons.forEach((btn,i)=>{
    btn.style.background="#1f3a5f";
    if(i === currentQuestions[currentIndex].correct){
      btn.style.background="#2ecc71";
    }
  });
}

function highlightSelection(c,s){
  let buttons = quizContainer.querySelectorAll("button");
  buttons.forEach((btn,i)=>{
    btn.disabled = true;
    if(i === c) btn.style.background="#2ecc71";
    if(i === s && i !== c) btn.style.background="#e74c3c";
  });
}

function finishQuiz(){
  if(mode === "test"){
    resultBox.innerHTML =
      "<div style='margin-top:20px;font-weight:bold'>Hotovo.<br>Správně: "
      + score + " / " + currentQuestions.length +
      "<br>Úspěšnost: "
      + Math.round((score/currentQuestions.length)*100)
      + " %</div>";
  }
}

