document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector("form");
  const input = document.querySelector('input[name="word"]');
  const scoreElement = document.getElementById("score");
  const shareButton = document.getElementById("share");
  const scoresTableBody = document.getElementById("scores-table-body");
  fetchTopScores();
  if(form){
    form.addEventListener("submit", function (event) {
      const value = input.value;
      const regex = /^[a-zA-Z]+$/;
      if (!regex.test(value)) {
        event.preventDefault();
        alert("Invalid input: only letters are allowed.");
      }
    });
    
    // Mise a jour du score toutes les secondes
    setInterval(fetchScore, 1000);
  }
  
  // si le bouton de partage existe
  if(shareButton){
    // lance la mise a jour du tableau des scores
    

    // Ajoute un event listener sur le bouton de partage
    shareButton.addEventListener("click", function () {
      const score = scoreElement.textContent.split(": ")[1];
      const text = `I just scored ${score} points in the Hangman game! Can you beat my score?`;
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        text
      )}`;
      window.open(url, "_blank");
    });
  }

  // Mise a jour du score
  async function fetchScore() {
    try {
      const response = await fetch("/score");
      const data = await response.text();
      // {"score":994} -> Score: 994
      let score = JSON.parse(data).score;
      scoreElement.textContent = `Score : ${score}`;
    } catch (error) {
      console.error("Error fetching score:", error);
    }
  }
  // Mise a jour du tableau des scores
  async function fetchTopScores() {
    try {
      const response = await fetch("/top-scores");
      const scores = await response.json();
      console.log(scores); // return empty array
      scoresTableBody.innerHTML = scores
        .map(
          (score) => `
        <tr>
          <td>${score.playerId}</td>
          <td>${score.score}</td>
        </tr>
      `
        )
        .join("");
    } catch (error) {
      console.error("Error fetching top scores:", error);
    }
  }
});
