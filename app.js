console.log("SPL READY");

/* =========================
   METAR GENERATOR
========================= */
async function loadMetar() {
  try {
    const response = await fetch(
      "https://api.allorigins.win/raw?url=" +
      encodeURIComponent("https://aviationweather.gov/api/data/metar?ids=LKMT&format=raw&hours=1")
    );

    const metar = await response.text();

    if (metar.trim() === "") {
      document.getElementById("metarBox").innerText = "METAR není dostupný";
    } else {
      document.getElementById("metarBox").innerText = metar;
    }

  } catch (error) {
    document.getElementById("metarBox").innerText = "Chyba načítání METAR";
    console.error("METAR error:", error);
  }
}

loadMetar();
setInterval(loadMetar, 1800000);





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


