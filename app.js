/* =========================
   SPL TRAINER – KOMPLETNÍ OPRAVENÁ VERZE
   Zachovává plnou funkcionalitu + statistiku
========================= */


/* =========================
   GLOBÁLNÍ PROMĚNNÉ
========================= */

let data = {};
let currentQuestions = [];
let currentIndex = 0;
let score = 0;
let mode = "study";

let correctColor = "#2e7d32";
let wrongColor = "#b71c1c";


/* =========================
   DOM
========================= */

const categorySelect = document.getElementById("categorySelect");
const quizContainer = document.getElementById("quizContainer");
const resultBox = document.getElementById("result");
const statsBox = document.getElementById("statsBox");

const randomToggle = document.getElementById("randomQuestions");
const questionLimitInput = document.getElementById("questionCount");

const correctColorPicker = document.getElementById("correctColorPicker");
const wrongColorPicker = document.getElementById("wrongColorPicker");


/* =========================
   BARVY
========================= */

if (correctColorPicker)
  correctColorPicker.addEventListener("input", e =>
    correctColor = e.target.value);

if (wrongColorPicker)
  wrongColorPicker.addEventListener("input", e =>
    wrongColor = e.target.value);


/* =========================
   USER ID
========================= */

function getUserId() {

  let id = localStorage.getItem("spl_user_id");

  if (!id) {

    id = crypto.randomUUID();

    localStorage.setItem("spl_user_id", id);

  }

  return id;

}

const userId = getUserId();


/* =========================
   PRESENCE
========================= */

async function setupPresence() {

  if (!window.rtdb) return;

  const ref = window.rtdbRef(window.rtdb, "presence/" + userId);

  await window.rtdbSet(ref, {
    online: true,
    lastSeen: Date.now()
  });

  window.rtdbOnDisconnect(ref).set({
    online: false,
    lastSeen: Date.now()
  });

}


/* =========================
   STATISTIKA
========================= */

async function saveStats(correct, total) {

  if (!window.rtdb) return;

  const ref = window.rtdbRef(window.rtdb, "stats/" + userId);

  const snapshot = await new Promise(resolve =>
    window.rtdbOnValue(ref, resolve, { onlyOnce: true }));

  let stats = snapshot.val() || {
    totalTests: 0,
    totalCorrect: 0,
    totalQuestions: 0
  };

  stats.totalTests++;
  stats.totalCorrect += correct;
  stats.totalQuestions += total;

  await window.rtdbSet(ref, stats);

}


function loadStats() {

  if (!window.rtdb) return;

  const ref = window.rtdbRef(window.rtdb, "stats/" + userId);

  window.rtdbOnValue(ref, snapshot => {

    if (!snapshot.exists()) {

      statsBox.innerHTML = "Statistika zatím není";
      return;

    }

    const s = snapshot.val();

    const percent = Math.round(
      (s.totalCorrect / s.totalQuestions) * 100);

    statsBox.innerHTML = `
    Testů: ${s.totalTests}<br>
    Úspěšnost: ${percent}%<br>
    ${s.totalCorrect}/${s.totalQuestions}`;

  });

}


/* =========================
   NAČTENÍ DAT
========================= */

fetch("data.json")

.then(r => r.json())

.then(json => {

  data = json;

  initCategories();

  startStudy();

});


/* =========================
   KATEGORIE
========================= */

function initCategories() {

  categorySelect.innerHTML = "";

  Object.keys(data).forEach(cat => {

    const opt = document.createElement("option");

    opt.value = cat;
    opt.textContent = cat;

    categorySelect.appendChild(opt);

  });

}


/* =========================
   PŘÍPRAVA OTÁZEK
========================= */

function prepareQuestions() {

  const cat = categorySelect.value;

  let questions = [...data[cat]];

  questions = questions.map((q,i)=>({...q,_originalIndex:i+1}));


  if (randomToggle.checked) {

    questions.sort(()=>Math.random()-0.5);

  }


  const limit = parseInt(questionLimitInput.value);

  if (!isNaN(limit) && limit>0 && limit<questions.length)

    questions = questions.slice(0,limit);


  currentQuestions = questions;

  currentIndex = 0;

  score = 0;

}


/* =========================
   REŽIMY
========================= */

function startStudy() {

  mode="study";

  prepareQuestions();

  showQuestion();

}


function startTest() {

  mode="test";

  prepareQuestions();

  showQuestion();

}


/* =========================
   ZOBRAZENÍ OTÁZKY
========================= */

function showQuestion() {

  const q=currentQuestions[currentIndex];

  let html=`

  <div>
  Otázka ${currentIndex+1}/${currentQuestions.length}
  (#${q._originalIndex})
  </div>

  <h3>${q.question}</h3>`;


  q.answers.forEach((a,i)=>{

    html+=`<button class="answerBtn" onclick="selectAnswer(${i})" id="btn${i}">${a}</button>`;

  });


  html+=`
  <br>
  <button onclick="prevQuestion()">←</button>
  <button onclick="nextQuestion()">→</button>`;


  quizContainer.innerHTML=html;


  if(mode==="study")

    showCorrectAnswer();

}


/* =========================
   SPRÁVNÁ ODPOVĚĎ
========================= */

function showCorrectAnswer(){

  const correct=currentQuestions[currentIndex].correct;

  const btn=document.getElementById("btn"+correct);

  if(btn) btn.style.background=correctColor;

}


/* =========================
   VÝBĚR ODPOVĚDI
========================= */

function selectAnswer(index){

  const correct=currentQuestions[currentIndex].correct;

  if(mode==="test"){

    if(index===correct){

      score++;

      document.getElementById("btn"+index).style.background=correctColor;

    }

    else{

      document.getElementById("btn"+index).style.background=wrongColor;

      document.getElementById("btn"+correct).style.background=correctColor;

    }

  }

}


/* =========================
   NAVIGACE
========================= */

function nextQuestion(){

  if(currentIndex<currentQuestions.length-1){

    currentIndex++;

    showQuestion();

  }

  else finish();

}


function prevQuestion(){

  if(currentIndex>0){

    currentIndex--;

    showQuestion();

  }

}


/* =========================
   KONEC TESTU
========================= */

async function finish(){

  if(mode!=="test")return;

  const total=currentQuestions.length;

  const percent=Math.round(score/total*100);

  resultBox.innerHTML=`Výsledek: ${score}/${total} (${percent}%)`;

  await saveStats(score,total);

  loadStats();

}


/* =========================
   START
========================= */

window.addEventListener("load",()=>{

  setupPresence();

  loadStats();

});
