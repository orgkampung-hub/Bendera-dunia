let allFlags = [];
let currentQuestion = 1;
let lives = 3;
let score = 0;
let displayScore = 0; 
let correctCountry = {};
let selectedRegion = "";
let streak = 0;

const G_SHEET_URL = "https://script.google.com/macros/s/AKfycbwDVf6C-2Zw9qyFuZRZXlSI5WgsSt67Cm-cisBneoijmXDi5rPio_E4rDU_DclszlH1/exec";

// Audio Setup
const sndCorrect = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
const sndWrong = new Audio('https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3'); 
const sndClick = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
const sndVictory = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');

function playSound(audio) {
    audio.pause();
    audio.currentTime = 0;
    audio.play();
}

function updateScoreDisplay() {
    const scoreElement = document.getElementById('current-score-big');
    if (!scoreElement) return; // Elak error jika ID tak jumpa
    
    const interval = setInterval(() => {
        if (displayScore < score) {
            displayScore++;
            scoreElement.innerText = displayScore;
        } else if (displayScore > score) {
            displayScore--;
            scoreElement.innerText = displayScore;
        } else {
            clearInterval(interval);
        }
    }, 30);
}

window.onload = loadWelcomeRanking;

async function loadWelcomeRanking() {
    const list = document.getElementById('welcome-ranking-list');
    if (!list) return;
    try {
        const res = await fetch(G_SHEET_URL);
        const top5 = await res.json();
        list.innerHTML = "";
        if(!top5 || top5.length === 0) { list.innerHTML = "<p>Tiada rekod.</p>"; return; }
        top5.sort((a, b) => b.skor - a.skor);
        top5.slice(0, 5).forEach((p, i) => {
            list.innerHTML += `<p><span>${i+1}. ${p.nama} <small style="background:#FFEB3B;color:#333;padding:1px 3px;border-radius:2px;font-size:0.5rem;">${p.benua}</small></span> <span>${p.skor} pts</span></p>`;
        });
    } catch (e) { list.innerHTML = "<p>Ranking Offline</p>"; }
}

async function startGame(region) {
    playSound(sndClick);
    selectedRegion = region.toUpperCase();
    currentQuestion = 1; lives = 3; score = 0; displayScore = 0; streak = 0;
    
    document.getElementById('welcome-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    
    try {
        const response = await fetch(`https://restcountries.com/v3.1/region/${region}`);
        const data = await response.json();
        allFlags = data.sort((a, b) => b.population - a.population);
        renderQuestion();
    } catch (e) { 
        console.error("Error loading flags:", e);
        alert("Gagal memuatkan data bendera. Sila cuba lagi.");
        location.reload(); 
    }
}

function renderQuestion() {
    if (currentQuestion > allFlags.length) { victory(); return; }
    if (lives <= 0) return;
    
    document.getElementById('options-container').style.pointerEvents = 'auto';
    
    // SYNC ID DENGAN HTML BARU
    const lvlEl = document.getElementById('current-level');
    const livesEl = document.getElementById('lives');
    
    if (lvlEl) lvlEl.innerText = currentQuestion;
    if (livesEl) livesEl.innerText = "❤️".repeat(lives);
    
    updateScoreDisplay(); 
    
    const b50 = document.getElementById('btn-5050');
    const bSkip = document.getElementById('btn-skip');
    if (b50) b50.disabled = score < 15;
    if (bSkip) bSkip.disabled = score < 25;
    
    correctCountry = allFlags[currentQuestion - 1];
    document.getElementById('flag-img').src = correctCountry.flags.png;
    
    // Pre-fetch
    if (currentQuestion < allFlags.length) {
        const nextFlag = new Image();
        nextFlag.src = allFlags[currentQuestion].flags.png;
    }
    
    generateOptions(correctCountry);
}

function generateOptions(correct) {
    let options = [correct.name.common];
    while (options.length < 4) {
        let rName = allFlags[Math.floor(Math.random() * allFlags.length)].name.common;
        if (!options.includes(rName)) options.push(rName);
    }
    options.sort(() => Math.random() - 0.5);
    const container = document.getElementById('options-container');
    container.innerHTML = '';
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.innerText = opt;
        btn.onclick = () => checkAnswer(opt, btn);
        container.appendChild(btn);
    });
}

function checkAnswer(selected, btn) {
    document.getElementById('options-container').style.pointerEvents = 'none';
    if (selected === correctCountry.name.common) {
        playSound(sndCorrect); 
        score += 10; currentQuestion++; streak++;
        btn.style.background = "#2ecc71";
        btn.style.boxShadow = "0 2px 0 #27ae60"; 
        btn.style.transform = "translateY(4px)";
        showToast("BETUL! 🎉", "correct");
        setTimeout(renderQuestion, 1200);
    } else {
        playSound(sndWrong); 
        lives--; streak = 0;
        btn.style.background = "#e74c3c";
        btn.style.boxShadow = "0 2px 0 #c0392b";
        btn.style.transform = "translateY(4px)";
        showToast(`SALAH! Itu ${correctCountry.name.common}`, "wrong");
        
        if (lives > 0) {
            currentQuestion++;
            setTimeout(renderQuestion, 1500);
        } else {
            setTimeout(() => gameOver("GAME OVER"), 1000);
        }
    }
}

function use5050() {
    if (score < 15) return;
    playSound(sndClick); 
    score -= 15;
    updateScoreDisplay();
    document.getElementById('btn-5050').disabled = true;
    const buttons = Array.from(document.querySelectorAll('.options-grid button'));
    let removed = 0;
    buttons.sort(() => Math.random() - 0.5);
    buttons.forEach(btn => {
        if (btn.innerText !== correctCountry.name.common && removed < 2) {
            btn.style.visibility = 'hidden'; 
            btn.style.pointerEvents = 'none';
            removed++;
        }
    });
}

function useSkip() {
    if (score < 25) return;
    playSound(sndClick); 
    score -= 25; 
    updateScoreDisplay();
    currentQuestion++; streak = 0;
    showToast("SKIPPED! ⏭️", "correct"); 
    setTimeout(renderQuestion, 500);
}

function victory() {
    playSound(sndVictory);
    const bonus = lives * 50;
    score += bonus;
    updateScoreDisplay();
    
    let kingBadge = "";
    if (selectedRegion === 'ASIA') kingBadge = "asia_king";
    else if (selectedRegion === 'EUROPE') kingBadge = "europe_king";
    else if (selectedRegion === 'AFRICA') kingBadge = "africa_king";
    else if (selectedRegion === 'AMERICAS') kingBadge = "americas_king";

    setTimeout(() => {
        alert(`TAHNIAH! 🎉\nSkor Akhir: ${score}`);
        gameOver("VICTORY! 🏆", kingBadge);
    }, 1000);
}

function confirmHome() { if(confirm("Menu Utama?")) location.reload(); }

function showToast(msg, type) {
    const t = document.getElementById('message-toast');
    if (!t) return;
    t.innerText = msg; t.className = `toast ${type}`;
    t.classList.remove('hidden'); 
    setTimeout(() => t.classList.add('hidden'), 1500);
}

function gameOver(statusText, kingBadge = "") {
    let nama = prompt(`${statusText}!\nSkor: ${score}\nNama:`);
    if (nama && nama.trim() !== "") {
        let cleanName = nama.trim().toUpperCase();
        let achs = [];
        if (kingBadge) achs.push(kingBadge);
        if (score >= 100) achs.push("score_100");
        if (streak >= 5) achs.push("sharp_shooter");
        if (lives === 3 && statusText.includes("VICTORY")) achs.push("perfect_win");

        fetch(G_SHEET_URL, { 
            method: "POST", 
            mode: "no-cors", 
            body: JSON.stringify({ 
                nama: cleanName, 
                skor: score, 
                benua: selectedRegion, 
                pencapaian: achs.join(",") 
            }) 
        }).then(() => {
            alert("Data berjaya disimpan!");
            location.reload();
        }).catch(() => location.reload());
    } else location.reload();
}
