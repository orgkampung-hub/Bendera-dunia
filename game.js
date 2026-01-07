let pools = { level1: [], level2: [], level3: [], legendary: [] };
let currentQuestion = 0;
let score = 0;
let lives = 3;
let currentCorrectCountry = null;
const MAX_QUESTIONS = 200; 

// Trackers Achievement
let consecutiveCorrect = 0;
let powerUpsUsed = 0;
let level1NoDamage = true;
let badgesEarned = [];

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxRn-tXv1AmOeXuKnjxuqmtPdG0prMgzw2fPAa8IhLHz6glzpIdtN2tToB0TOs4Wz_V/exec";

// Audio
const sndCorrect = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
const sndWrong = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
const sndPowerUp = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
const sndLifeLost = new Audio('https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3'); // Bunyi impak/gasp

async function loadGame() {
  try {
    const response = await fetch('https://restcountries.com/v3.1/all?fields=name,flags,population,unMember,cca2');
    const data = await response.json();
    
    let sorted = data.filter(c => {
      const isIsrael = (c.cca2 === 'IL');
      const isPalestine = (c.cca2 === 'PS');
      const isUnMember = c.unMember === true;
      return (isUnMember || isPalestine) && !isIsrael;
    }).sort((a, b) => b.population - a.population);
    
    pools.level1 = sorted.slice(0, 20).sort(() => Math.random() - 0.5);
    pools.level2 = sorted.slice(20, 40).sort(() => Math.random() - 0.5);
    pools.level3 = sorted.slice(40, 60).sort(() => Math.random() - 0.5);
    pools.legendary = sorted.slice(60).sort(() => Math.random() - 0.5);
    
    updateUI(); 
    generateQuestion();
  } catch (error) { console.error("API Error", error); }
}

function updateUI() {
  document.getElementById("scoreText").textContent = score;
  document.getElementById("qNum").textContent = currentQuestion + 1;
  updateLevelUI(currentQuestion);

  const livesContainer = document.getElementById("livesEmojis");
  if(livesContainer) {
    // Papar nyawa: ❤️ aktif, manakala yang hilang jadi malap
    livesContainer.innerHTML = "";
    for(let i=0; i<3; i++) {
        const heart = document.createElement("span");
        heart.textContent = "❤️";
        heart.style.opacity = (i < lives) ? "1" : "0.2";
        heart.style.transition = "0.3s";
        livesContainer.appendChild(heart);
    }
  }
}

// FUNGSI BARU: Efek Gegar & Merah
function triggerDamageEffect() {
  document.body.classList.add('shake-screen', 'red-flash');
  sndLifeLost.play();
  
  setTimeout(() => {
    document.body.classList.remove('shake-screen', 'red-flash');
  }, 400);
}

function updateLevelUI(qIndex) {
  const lvlEl = document.getElementById("levelName");
  let lvlText = "";
  if (qIndex < 20) { lvlText = "(Easy)"; lvlEl.style.color = "#2ecc71"; }
  else if (qIndex < 40) { 
    if(level1NoDamage && !badgesEarned.includes("Survivor")) badgesEarned.push("Survivor");
    lvlText = "(Medium)"; lvlEl.style.color = "#f1c40f"; 
  }
  else if (qIndex < 60) { lvlText = "(Hard)"; lvlEl.style.color = "#e67e22"; }
  else { 
    if(!badgesEarned.includes("The Legend")) badgesEarned.push("The Legend");
    lvlText = "(Legendary)"; lvlEl.style.color = "#e74c3c"; 
  }
  lvlEl.textContent = lvlText;
  return lvlText.replace(/[()]/g, '');
}

function checkAnswer(isCorrect, btn) {
  const btns = document.querySelectorAll('.ans-btn');
  btns.forEach(b => b.style.pointerEvents = 'none');

  if (isCorrect) {
    btn.classList.add('correct-flash');
    sndCorrect.play();
    score += 1;
    consecutiveCorrect++;
    
    // Check Achievements
    if (score >= 1 && !badgesEarned.includes("First Step")) badgesEarned.push("First Step");
    if (score >= 10 && !badgesEarned.includes("Double Digit")) badgesEarned.push("Double Digit");
    if (consecutiveCorrect >= 10 && !badgesEarned.includes("Sharpshooter")) badgesEarned.push("Sharpshooter");
    if (score >= 100 && !badgesEarned.includes("Halfway Hero")) badgesEarned.push("Halfway Hero");
    if (score >= 150 && !badgesEarned.includes("Centurion")) badgesEarned.push("Centurion");
    if (score >= 200 && !badgesEarned.includes("Conqueror")) badgesEarned.push("Conqueror");
    if (score >= 50 && powerUpsUsed === 0 && !badgesEarned.includes("Economist")) badgesEarned.push("Economist");
    if (score >= 150 && lives === 1 && !badgesEarned.includes("Comeback King")) badgesEarned.push("Comeback King");

    showToast("✅ BETUL!", "correct");
    
    currentQuestion++;
    setTimeout(() => {
        updateUI();
        generateQuestion();
    }, 1200);

  } else {
    btn.classList.add('wrong-flash');
    sndWrong.play();
    lives--;
    consecutiveCorrect = 0;
    if (currentQuestion < 20) level1NoDamage = false; 
    
    // Panggil efek visual & bunyi kerosakan
    triggerDamageEffect();
    
    showToast(`❌ SALAH!<br><span style="font-size:0.7rem">Jawapan: ${currentCorrectCountry.name.common}</span>`, "wrong");
    
    updateUI(); 

    if (lives <= 0) {
      setTimeout(saveToSheet, 1200);
    } else {
      currentQuestion++;
      setTimeout(generateQuestion, 1300);
    }
  }
}

function usePowerUp(type) {
  if (type === 'skip') {
    if (score >= 4) {
      powerUpsUsed++;
      sndPowerUp.play();
      score -= 4;
      currentQuestion++;
      updateUI();
      generateQuestion();
    } else { alert("Skor tak cukup untuk Skip! (Perlu 4)"); }
  } else if (type === '5050') {
    if (score >= 2) {
      powerUpsUsed++;
      sndPowerUp.play();
      score -= 2;
      updateUI();
      const btns = Array.from(document.querySelectorAll('.ans-btn'));
      let removed = 0;
      btns.forEach(b => {
        if (b.textContent !== currentCorrectCountry.name.common && b.style.visibility !== "hidden" && removed < 2) {
          b.style.visibility = "hidden";
          removed++;
        }
      });
    } else { alert("Skor tak cukup untuk 50:50! (Perlu 2)"); }
  }
}

function saveToSheet() {
  let existingBadgesRaw = localStorage.getItem('lastBadges') || "";
  let existingArray = existingBadgesRaw ? existingBadgesRaw.split(",") : [];
  let allBadges = [...new Set([...existingArray, ...badgesEarned])];
  
  localStorage.setItem('lastScore', score);
  localStorage.setItem('lastLevel', updateLevelUI(currentQuestion));
  localStorage.setItem('lastBadges', allBadges.join(","));
  
  location.href = "gameover.html";
}

function generateQuestion() {
  if (lives <= 0 || currentQuestion >= MAX_QUESTIONS) {
    if (currentQuestion >= MAX_QUESTIONS) {
       showToast("🏆 TAHNIAH! ANDA TAMATKAN SEMUA SOALAN!", "correct");
       setTimeout(saveToSheet, 2000);
    }
    return;
  }
  
  currentCorrectCountry = getCorrectCountry(currentQuestion);
  let all = [...pools.level1, ...pools.level2, ...pools.level3, ...pools.legendary];
  
  let options = [currentCorrectCountry];
  while (options.length < 4) {
    let r = all[Math.floor(Math.random() * all.length)];
    if (!options.includes(r)) options.push(r);
  }
  options.sort(() => Math.random() - 0.5);

  document.getElementById("flagImg").src = currentCorrectCountry.flags.png;
  
  const grid = document.getElementById("answersGrid");
  grid.innerHTML = "";
  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "ans-btn";
    btn.textContent = opt.name.common;
    btn.onclick = (e) => checkAnswer(opt === currentCorrectCountry, e.target);
    grid.appendChild(btn);
  });
}

function getCorrectCountry(qIndex) {
  if (qIndex < 20) return pools.level1[qIndex];
  if (qIndex < 40) return pools.level2[qIndex - 20];
  if (qIndex < 60) return pools.level3[qIndex - 40];
  let idx = qIndex - 60;
  return pools.legendary[idx] || pools.legendary[Math.floor(Math.random() * pools.legendary.length)];
}

function showToast(html, type) {
  const t = document.getElementById("toast");
  if(!t) return;
  t.innerHTML = html; 
  t.className = `toast show ${type}`;
  setTimeout(() => t.className = "toast", 1100);
}

function goHome() { location.href = "index.html"; }

loadGame();
