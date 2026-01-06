const MASTER_TROPHIES = [
    { id: 'score_100', name: 'CENTURION', icon: '🎖️', desc: 'Skor 100 ke atas' },
    { id: 'perfect_win', name: 'SURVIVOR', icon: '🔥', desc: 'Menang 3 nyawa penuh' },
    { id: 'sharp_shooter', name: 'SHARP SHOOTER', icon: '🎯', desc: '5 betul berturut-turut' },
    { id: 'asia_king', name: 'ASIA KING', icon: '🏮', desc: 'Khatam Benua Asia' },
    { id: 'europe_king', name: 'EUROPE KING', icon: '🏰', desc: 'Khatam Benua Eropah' },
    { id: 'africa_king', name: 'AFRICA KING', icon: '🦁', desc: 'Khatam Benua Afrika' },
    { id: 'americas_king', name: 'AMERICAS KING', icon: '🤠', desc: 'Khatam Benua Amerika' },
    { id: 'oceania_king', name: 'OCEANIA KING', icon: '🌊', desc: 'Khatam Benua Oceania' }
];

const G_SHEET_URL = "https://script.google.com/macros/s/AKfycbwDVf6C-2Zw9qyFuZRZXlSI5WgsSt67Cm-cisBneoijmXDi5rPio_E4rDU_DclszlH1/exec";

window.onload = () => { loadAllWinners(); };

async function loadAllWinners() {
    const grid = document.getElementById('trophy-grid');
    grid.innerHTML = "<p style='color:white;'>Memuatkan senarai jaguh...</p>";
    try {
        const res = await fetch(G_SHEET_URL);
        const allData = await res.json();
        grid.innerHTML = '';
        MASTER_TROPHIES.forEach(trophy => {
            const winners = allData.filter(p => {
                const achs = p.pencapaian ? p.pencapaian.split(',') : [];
                return achs.includes(trophy.id);
            });
            let winnersHTML = winners.length > 0 ? winners.map(w => `<span class="winner-name">⭐ ${w.nama}</span>`).join('') : `<span class="no-winner">Belum ada pemenang</span>`;
            grid.innerHTML += `
                <div class="trophy-card ${winners.length > 0 ? 'has-winners' : ''}">
                    <div class="trophy-icon">${trophy.icon}</div>
                    <div class="trophy-name">${trophy.name}</div>
                    <div class="trophy-desc" style="font-size: 0.6rem; margin-bottom: 8px; color: #fff;">${trophy.desc}</div>
                    <div class="winner-list">
                        <div style="font-weight: bold; border-bottom: 1px solid gold; margin-bottom: 4px;">PEMENANG:</div>
                        ${winnersHTML}
                    </div>
                </div>`;
        });
    } catch (e) { 
        grid.innerHTML = "<p style='color:red;'>Gagal tarik data. Sila refresh.</p>"; 
    }
}
