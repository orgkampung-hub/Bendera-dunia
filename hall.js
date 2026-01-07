const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxRn-tXv1AmOeXuKnjxuqmtPdG0prMgzw2fPAa8IhLHz6glzpIdtN2tToB0TOs4Wz_V/exec";

// Mapping nama badge kepada emoji untuk paparan ranking
const BADGE_ICONS = {
  "First Step": "🎯",
  "Double Digit": "🔟",
  "Sharpshooter": "🔥",
  "Survivor": "🛡️",
  "Halfway Hero": "🥈",
  "Economist": "💰",
  "Comeback King": "⚡",
  "Centurion": "🏅",
  "The Legend": "👑",
  "Conqueror": "🏆"
};

function init() {
    const s = localStorage.getItem('lastScore') || 0;
    const l = localStorage.getItem('lastLevel') || '-';
    const b = localStorage.getItem('lastBadges') || "";
    
    document.getElementById('lastScore').textContent = s;
    document.getElementById('lastLevel').textContent = l;

    const earned = b.split(",").map(item => item.trim()).filter(item => item !== "");
    const cards = document.querySelectorAll('.badge-card');
    
    cards.forEach(card => {
        const id = card.getAttribute('data-id');
        if (earned.includes(id)) {
            card.classList.remove('lock');
        }
    });

    fetchRanking();
}

async function fetchRanking() {
    const loader = document.getElementById('loader');
    const table = document.getElementById('lbTable');
    const body = document.getElementById('lbBody');

    try {
        const res = await fetch(SCRIPT_URL);
        const raw = await res.json();

        const data = raw.map(r => ({
            nama: r.nama || r.Nama || r.name || "Pemain",
            skor: parseInt(r.skor || r.Skor || r.score || 0),
            level: r.level || r.Level || "-",
            badges: r.badges || r.Badges || ""
        })).sort((a, b) => b.skor - a.skor);

        body.innerHTML = "";
        
        data.slice(0, 10).forEach((p, i) => {
            // Tukar string badges kepada barisan emoji
            const playerBadges = p.badges.split(",")
                .map(bName => bName.trim())
                .filter(bName => BADGE_ICONS[bName])
                .map(bName => BADGE_ICONS[bName])
                .join(" ");

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="rank-col">#${i + 1}</td>
                <td>
                    <b style="color:#fff">${p.nama}</b><br>
                    <small style="color:#bdc3c7">${p.level}</small>
                    <div style="font-size: 0.8rem; margin-top: 2px;">${playerBadges}</div>
                </td>
                <td class="score-col">${p.skor}</td>
            `;
            body.appendChild(tr);
        });

        loader.style.display = "none";
        table.style.display = "table";

    } catch (e) {
        loader.textContent = "Gagal memuatkan ranking terkini.";
        console.error("Leaderboard Error:", e);
    }
}

document.addEventListener('DOMContentLoaded', init);
