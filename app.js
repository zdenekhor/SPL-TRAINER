console.log("SPL READY");

// ===============================
// METAR
// ===============================

async function loadMetar() {
  try {

    const response = await fetch(
      "https://corsproxy.io/?https://tgftp.nws.noaa.gov/data/observations/metar/stations/LKMT.TXT"
    );

    if (!response.ok) {
      throw new Error("HTTP error " + response.status);
    }

    const text = await response.text();
    const lines = text.trim().split("\n");
    const metar = lines[1] || "METAR není dostupný";

    document.getElementById("metarBox").innerText = metar;

  } catch (error) {
    document.getElementById("metarBox").innerText = "METAR nedostupný";
    console.warn("METAR error:", error);
  }
}

loadMetar();
setInterval(loadMetar, 300000);

// ===============================
// GLOBÁLNÍ STAV
// ===============================

let data = {};
let currentQuestions = [];
let currentIndex = 0;
let score = 0;
let mode = "study";

const categorySelect = document.getElementById("categorySelect");
const quizContainer = document.getElementById("quizContainer");

// ===============================
// NAČTENÍ OTÁZEK
// ===============================

async function loadData() {
  const response = await fetch("data.json");
  data = await response.json();
}

loadData();

// ===============================
// ZOBRAZENÍ OTÁZKY
// ===============================

function showQuestion() {

  const q = currentQuestions[c]()
