function startGame() {
  location.href = "game.html"
}

function openAchieve() {
  location.href = "achieve.html"
}

/* ===== DUMMY LEADERBOARD (TOP 5) ===== */
const leaderboardData = [
  { name: "Ali", score: 10 },
  { name: "Abu", score: 9 },
  { name: "Siti", score: 9 },
  { name: "Aina", score: 8 },
  { name: "Dan", score: 7 }
]

const list = document.getElementById("leaderList")
leaderboardData.forEach(p => {
  const li = document.createElement("li")
  li.textContent = `${p.name} — ${p.score}`
  list.appendChild(li)
})
