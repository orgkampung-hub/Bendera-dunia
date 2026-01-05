let allFlags = [];
let currentQuestion = 1;
let lives = 3;
let score = 0;
let correctCountry = {};
let selectedRegion = "";

const G_SHEET_URL = "https://script.google.com/macros/s/AKfycbwO8XtS4u5ivZQTSfCFsb3hy5kSf3iMdUii98gre-DMpsLpautG_i8rFbIYzgKeEue7/exec";

// Sound Assets - DIKEMASKINI DENGAN BUNYI BUZZ
const sndCorrect = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
const sndWrong = new Audio('https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3'); // Sound BUZZER
const sndClick = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
const sndVictory = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');

window.onload = loadWelcomeRanking;

async function loadWelcomeRanking() {
    const list = document.getElementById('welcome-ranking-list');
    try {
        const res = await fetch(G_SHEET_URL);
        const top5 = await res.json();
        list.innerHTML = "";
        if(!top5 || top5.length === 0) { list.innerHTML = "<p>Tiada rekod.</p>"; return; }
        top5.forEach((p, i) => {
            list.innerHTML += `<p><span>${i+1}. ${p.nama}<span class="benua-tag">${p.benua}</span></span> <span>${p.skor} pts</span></p>`;
        });
    } catch (e) { list.innerHTML = "<p>Ranking offline.</p>"; }
}

async function startGame(region) {
    sndClick.play();
    selectedRegion = region.toUpperCase();
    currentQuestion = 1;
    lives = 3;
    score = 0;
    
    document.getElementById('welcome-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    try {
        const response = await fetch(`https://restcountries.com/v3.1/region/${region}`);
        const data = await response.json();
        allFlags = data.sort((a, b) => b.population - a.population);
        document.getElementById('q-total').innerText = allFlags.length;
        renderQuestion();
    } catch (e) { location.reload(); }
}

function renderQuestion() {
    if (currentQuestion > allFlags.length) {
        victory();
        return;
    }
    if (lives <= 0) return;
    
    document.getElementById('options-container').style.pointerEvents = 'auto';
    document.getElementById('current-score').innerText = score;
    document.getElementById('q-number').innerText = currentQuestion;
    document.getElementById('lives').innerText = "❤️".repeat(lives);
    
    document.getElementById('btn-5050').disabled = score < 15;
    document.getElementById('btn-skip').disabled = score < 25;

    let targetIndex = currentQuestion - 1;
    correctCountry = allFlags[targetIndex];
    document.getElementById('flag-img').src = correctCountry.flags.png;
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
        sndCorrect.play();
        score += 10; currentQuestion++;
        btn.style.background = "#2ecc71";
        showToast("BETUL! 🎉", "correct");
        setTimeout(renderQuestion, 1200);
    } else {
        sndWrong.play(); // Bunyi Buzz akan keluar di sini
        lives--;
        btn.style.background = "#e74c3c";
        showToast(`SALAH! Itu ${correctCountry.name.common}`, "wrong");
        if (lives > 0) {
            currentQuestion++;
            setTimeout(renderQuestion, 1500);
        } else {
            setTimeout(() => gameOver("GAME OVER"), 1000);
        }
    }
}

function confirmHome() {
    if(confirm("Kembali ke Menu Utama? (Skor tidak disimpan)")) {
        location.reload();
    }
}

function use5050() {
    if (score < 15) return;
    sndClick.play();
    score -= 15;
    document.getElementById('current-score').innerText = score;
    document.getElementById('btn-5050').disabled = true;
    const buttons = Array.from(document.querySelectorAll('.options-grid button'));
    let removed = 0;
    buttons.forEach(btn => {
        if (btn.innerText !== correctCountry.name.common && removed < 2) {
            btn.style.visibility = 'hidden';
            removed++;
        }
    });
}

function useSkip() {
    if (score < 25) return;
    sndClick.play();
    score -= 25;
    currentQuestion++;
    showToast("SKIPPED! ⏭️", "correct");
    renderQuestion();
}

function victory() {
    sndVictory.play();
    const bonus = lives * 50;
    score += bonus;
    alert(`TAHNIAH! 🎉\n\nSelesai benua ${selectedRegion}!\nBonus Nyawa: +${bonus}\nSkor Akhir: ${score}`);
    gameOver("VICTORY! 🏆");
}

function showToast(msg, type) {
    const t = document.getElementById('message-toast');
    t.innerText = msg; t.className = `toast ${type}`;
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 1500);
}

async function fetchRanking() {
    const list = document.getElementById('ranking-list');
    list.innerHTML = "Memuatkan ranking...";
    document.getElementById('leaderboard-modal').classList.remove('hidden');
    try {
        const res = await fetch(G_SHEET_URL);
        const top5 = await res.json();
        list.innerHTML = "";
        top5.forEach((p, i) => {
            list.innerHTML += `<p>${i+1}. <b>${p.nama}</b> - ${p.skor} pts (${p.benua})</p>`;
        });
    } catch (e) { list.innerHTML = "Gagal memuatkan ranking."; }
}

function gameOver(statusText) {
    document.getElementById('final-status').innerText = statusText;
    let nama = prompt(`${statusText}!\nSkor: ${score}\nMasukkan nama anda:`);
    if (nama && nama.trim() !== "") {
        fetch(G_SHEET_URL, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify({ nama: nama, skor: score, benua: selectedRegion })
        }).then(() => {
            setTimeout(fetchRanking, 500);
        });
    } else { location.reload(); }
}
