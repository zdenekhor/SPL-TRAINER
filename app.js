console.log("SPL READY");

/* =========================
   METAR GENERATOR
========================= */

function generateMetar() {
const APP_ENV = "dev"; // změnit na "prod" v main
  const windDir = Math.floor(Math.random() * 36) * 10;
  const windSpeed = Math.floor(Math.random() * 20) + 1;
  const visibility = ["9999", "8000", "6000", "4000"];
  const clouds = ["FEW020", "SCT030", "BKN040", "OVC050"];
  const temp = Math.floor(Math.random() * 25) - 5;
  const dew = temp - Math.floor(Math.random() * 5);
  const qnh = 980 + Math.floor(Math.random() * 40);

   
if (APP_ENV === "dev") { // baner test
  const banner = document.getElementById("devBanner");
  if (banner) banner.style.display = "block";
}


   
  const metar =
    "LKMT 131000Z " +
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
let correctColor = "#2ecc71";
let wrongColor = "#e74c3c";


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

function shuffleArray(array) { // FNK RANDOM PRO TEST
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

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

    currentQuestions = [...data[categorySelect.value]];
    currentIndex = 0;
    resultBox.innerHTML = "";

    const randomOn = document.getElementById("randomToggle").checked;
    const limitInput = document.getElementById("questionLimit").value;
    const limit = parseInt(limitInput);

    // random jen v testu
    if (mode === "test" && randomOn) {
        shuffleArray(currentQuestions);
    }

    // omezení počtu otázek jen v testu
    if (mode === "test" && !isNaN(limit) && limit > 0 && limit < currentQuestions.length) {
        currentQuestions = currentQuestions.slice(0, limit);
    }

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
      btn.style.background="#3fa46a";
;
    }
  });
}

function highlightSelection(c,s){
  let buttons = quizContainer.querySelectorAll("button");
  buttons.forEach((btn,i)=>{
    btn.disabled = true;
    if(i === c) btn.style.background="#3fa46a";
    if(i === s && i !== c) btn.style.background="#e74c3c";
  });
}
function finishQuiz(){
  if(mode === "test"){
    let percent = Math.round((score/currentQuestions.length)*100);

    saveStats(categorySelect.value, percent);

    resultBox.innerHTML =
      "<div style='margin-top:20px;font-weight:bold'>Hotovo.<br>Správně: "
      + score + " / " + currentQuestions.length +
      "<br>Úspěšnost: "
      + percent +
      " %</div><hr>" +
      showStats();
  }
}

/* =========================
   STATISTICS SYSTEM
========================= */

function saveStats(category, percentage){
  let stats = JSON.parse(localStorage.getItem("splStats")) || {};

  if(!stats[category]){
    stats[category] = {
      attempts: 0,
      totalPercent: 0,
      best: 0
    };
  }

  stats[category].attempts += 1;
  stats[category].totalPercent += percentage;

  if(percentage > stats[category].best){
    stats[category].best = percentage;
  }

  localStorage.setItem("splStats", JSON.stringify(stats));
}

function showStats(){
  let stats = JSON.parse(localStorage.getItem("splStats"));
  if(!stats) return "Žádná statistika.";

  let html = "<h3>Statistika</h3>";

  Object.keys(stats).forEach(cat=>{
    let avg = Math.round(stats[cat].totalPercent / stats[cat].attempts);

    html += `
      <div style="margin-bottom:10px;">
        <strong>${cat}</strong><br>
        Pokusů: ${stats[cat].attempts}<br>
        Průměr: ${avg}%<br>
        Nejlepší: ${stats[cat].best}%
      </div>
    `;
  });

  return html;
}
/* =========================
   GITHUB VERSION
========================= */

const GITHUB_USER = "zdenekhor";
const GITHUB_REPO = "SPL-TRAINER";

fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/commits/main`)
  .then(res => res.json())
  .then(data => {
    const shortHash = data.sha.substring(0,7);
    document.getElementById("versionInfo").innerText = "commit " + shortHash;
  })
  .catch(err => {
    document.getElementById("versionInfo").innerText = "verze nenalezena";
  });
// DETEKCE DEV VERZE
if (window.location.href.includes("dev")) {
  const banner = document.getElementById("devBanner");
  if (banner) banner.style.display = "block";
}



