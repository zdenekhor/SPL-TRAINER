let data = {};
let currentQuestions = [];
let currentIndex = 0;
let score = 0;
let mode = "study";

const categorySelect = document.getElementById("categorySelect");
const quizContainer = document.getElementById("quizContainer");
const resultBox = document.getElementById("result");

// Načtení JSON
fetch("data.json")
.then(response => response.json())
.then(json => {
    data = json;
    initCategories();
});

function initCategories(){
    categorySelect.innerHTML="";
    Object.keys(data).forEach(c=>{
        let o=document.createElement("option");
        o.value=c;
        o.textContent=c;
        categorySelect.appendChild(o);
    });
}

function startStudy(){ mode="study"; startQuiz(); }
function startTest(){ mode="test"; score=0; startQuiz(); }
function startEdit(){ mode="edit"; startQuiz(); }

function startQuiz(){
    currentQuestions=data[categorySelect.value];
    currentIndex=0;
    resultBox.innerHTML="";
    showQuestion();
}

function showQuestion(){

    if(currentIndex>=currentQuestions.length){
        finishQuiz();
        return;
    }

    let q=currentQuestions[currentIndex];
    let total=currentQuestions.length;
    let number=currentIndex+1;

    let html="<div style='margin-bottom:10px;font-weight:bold;'>Otázka "
        + number + " / " + total + "</div>";

    html+="<h3 style='font-size:18px;'>"+q.question+"</h3>";

    q.answers.forEach((a,i)=>{
        html+="<button onclick='selectAnswer("+i+")' \
        style='display:block;width:100%;margin:8px 0;padding:14px;font-size:16px;border-radius:10px;border:none;background:#1f3a5f;color:white;' \
        id='ans_"+i+"'>"+a+"</button>";
    });

    quizContainer.innerHTML=html;

    if(mode==="study"){
        document.getElementById("ans_"+q.correct).style.background="#2ecc71";
    }

    if(mode==="edit"){
        highlightCorrect();
    }
}

function selectAnswer(i){

    let correct=currentQuestions[currentIndex].correct;

    if(mode==="edit"){
        currentQuestions[currentIndex].correct=i;
        highlightCorrect();
        return;
    }

    if(mode==="test"){
        if(i===correct) score++;
        highlightSelection(correct,i);
        setTimeout(nextQuestion,700);
    }
}

function nextQuestion(){
    currentIndex++;
    showQuestion();
}

function highlightCorrect(){
    let buttons=quizContainer.querySelectorAll("button");
    buttons.forEach((btn,i)=>{
        btn.style.background="#1f3a5f";
        if(i===currentQuestions[currentIndex].correct){
            btn.style.background="#2ecc71";
        }
    });
}

function highlightSelection(c,s){
    let buttons=quizContainer.querySelectorAll("button");
    buttons.forEach((btn,i)=>{
        btn.disabled=true;
        if(i===c) btn.style.background="#2ecc71";
        if(i===s && i!==c) btn.style.background="#e74c3c";
    });
}

function finishQuiz(){
    quizContainer.innerHTML="";
    if(mode==="test"){
        resultBox.innerHTML="Hotovo.<br>Správně: "
            +score+" / "+currentQuestions.length+
            "<br>Úspěšnost: "+Math.round((score/currentQuestions.length)*100)+" %";
    } else if(mode==="edit"){
        resultBox.innerHTML="Režim úprav dokončen.";
    } else {
        resultBox.innerHTML="Studium dokončeno.";
    }
}
