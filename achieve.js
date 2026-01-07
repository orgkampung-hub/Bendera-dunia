const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby-ozjZ9uz-k9ERJipqW0K3J5_aBjvqEZAr45m9IBnOyN7CYlLAOT71foBwFIIyp64b/exec";

function loadPersonalStats() {
    const lastScore = localStorage.getItem('lastScore') || 0;
    const lastLevel = localStorage.getItem('lastLevel') || '-';
    
    // Ambil data, pecahkan jadi array, dan buang ruang kosong/string kosong
    const rawBadges = localStorage.getItem('lastBadges') || "";
    const earnedBadges = rawBadges.split(",")
                                  .map(b => b.trim())
                                  .filter(b => b !== "");

    if(document.getElementById('lastScore')) document.getElementById('lastScore').textContent = lastScore;
    if(document.getElementById('lastLevel')) document.getElementById('lastLevel').textContent = lastLevel;

    // Unlock Badges Visual
    const badgeCards = document.querySelectorAll('.badge-card');
    badgeCards.forEach(card => {
        const badgeId = card.getAttribute('data-id');
        
        // Check kalau badgeId wujud dalam senarai yang kita simpan
        if (earnedBadges.includes(badgeId)) {
            card.classList.remove('lock');
        } else {
            // Pastikan dia kekal lock kalau belum ada
            card.classList.add('lock');
        }
    });
}

async function fetchLeaderboard() {
  const loader = document.getElementById('loader');
  const table = document.getElementById('lbTable');
  const body = document.getElementById('lbBody');

  try {
    const response = await fetch(SCRIPT_URL);
    const data = await response.json();

    // Sort Skor Tertinggi
    data.sort((a, b) => b.score - a.score);

    body.innerHTML = "";
    
    // PAPAR TOP 10 SAHAJA
    data.slice(0, 10).forEach((row, index) => {
      const tr = document.createElement('tr');
      // Format badges dari Sheets untuk paparan table
      const badgeList = row.badges ? row.badges.split(',').join(', ') : 'Tiada Lencana';
      
      tr.innerHTML = `
        <td class="rank-col">#${index + 1}</td>
        <td>
          <b style="color: #fff;">${row.name}</b><br>
          <small style="color: #bdc3c7; font-size: 0.65rem;">${row.level} • <span style="color:#f1c40f">${badgeList}</span></small>
        </td>
        <td class="score-col">${row.score}</td>
      `;
      body.appendChild(tr);
    });

    loader.style.display = "none";
    table.style.display = "table";

  } catch (err) {
    loader.innerHTML = "Gagal memuatkan data.";
    console.error("Fetch Error:", err);
  }
}

window.onload = () => {
    loadPersonalStats();
    fetchLeaderboard();
};
