require("dotenv").config();
const express = require("express");
const path = require("path");
const session = require("express-session");
const Game = require("./game.js");
const PlayerManager = require("./playerManager.js");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const db = require("./database.js");

const PORT = process.env.PORT || 3030;
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.use(
  session({
    secret: "jeu du pendu",
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      secure: false,
    },
  })
);
app.use(bodyParser.json());

const playerManager = new PlayerManager();

let game;
async function startGame() {
  game = new Game();
  await game.intialize();
}

function isValidInput(input) {
  const regex = /^[a-zA-Z]+$/;
  return regex.test(input);
}

// Routes
app.get("/", async (request, response) => {
  let playerId = request.session.playerId || null;
  if (!playerId) {
    playerId = await playerManager.createPlayer();
    request.session.playerId = playerId;
  }
  const canPlay = await playerManager.canPlayerPlay(playerId);

  if (!canPlay) { // Inverted logic
    response.render("pages/index", {
      canPlay: false,
      nextPlayTime: await playerManager.getNextPlayTime(playerId),
    });
  } else {
    response.render("pages/index", {
      game: game.print(),
      word: game.word,
      numberOfTries: game.getNumberOfTries(),
      score: game.getScore(),
      gameStatus: game.getGameStatus(),
      canPlay: true,
      chosenLetters: game.getChosenLetters(),
    });
  }
});

app.post("/", async (request, response) => {
  let playerId = request.session.playerId || null;
  if (!playerId) {
    playerId = await playerManager.createPlayer();
    request.session.playerId = playerId;
  }
  const canPlay = await playerManager.canPlayerPlay(playerId);

  if (!canPlay) { // Inverted logic
    const nextPlayTime = await playerManager.getNextPlayTime(playerId);
    if (!response.headersSent) {
      response.render("pages/index", {
        canPlay: false,
        nextPlayTime: nextPlayTime,
      });
    }
  } else {
    try {
      if (request.body.reset) {
        console.log("Reset !");
        game.reset();
        playerManager.recordPlay(playerId);
      } else if (request.body.word) {
        if (!isValidInput(request.body.word)) {
          return response
            .status(400)
            .send("Invalid input. Only letters are allowed.");
        }
        let guess = game.guess(request.body.word);
        console.log("Guess :" + guess);

        if (game.getGameStatus() !== "playing") {
          await playerManager.recordPlay(playerId);
        }

        if (game.getGameStatus() === "won") {
          // Vérifier si le score a déjà été enregistré
          db.get(
            "SELECT playerId FROM scores WHERE playerId = ?",
            [playerId],
            (err, row) => {
              if (row) {
                return response.status(200).send("Score already saved");
              } else {
                console.log("Game won !");
                const score = game.getScore();
                console.log(`Received score: ${score} for player: ${playerId}`);

                db.run(
                  "INSERT INTO scores (playerId, score) VALUES (?, ?)",
                  [playerId, score],
                  function (err) {
                    if (err) {
                      console.error("Error saving score:", err);
                      if (!response.headersSent) {
                        return response.status(500).send("Error saving score");
                      }
                    } else {
                      if (!response.headersSent) {
                        response.status(200).send("Score saved");
                      }
                    }
                  }
                );
              }
            }
          );
        }

        if (game && game.isGameOver()) {
          game.stopScoring();
        }
      } else {
        console.log("No word provided in the request body.");
      }

      // Ici, vérifier que la réponse n'a pas été envoyée et faire le rendu de la page si nécessaire
      if (!response.headersSent) {
        response.render("pages/index", {
          game: game.print(),
          word: game.word,
          numberOfTries: game.getNumberOfTries(),
          score: game.getScore(),
          gameStatus: game.getGameStatus(),
          canPlay: true,
          chosenLetters: game.getChosenLetters(),
        });
      }
    } catch (error) {
      console.error(error.message);
      if (!response.headersSent) {
        response.status(500).send("An error occurred: " + error.message);
      }
    }
  }
});

app.get("/score", (request, response) => {
  if (game.getGameStatus() !== "playing") {
    // Game is over, stop scoring, return the final score
    return response.json({ score: game.getScore() });
  }
  response.json({ score: game.getScore() });
});

app.get("/top-scores", (req, res) => {
  db.all(
    "SELECT playerId, score FROM scores ORDER BY score DESC LIMIT 1000",
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).send("Error retrieving scores");
      }
      res.json(rows);
      if(!rows){
        res.status(404).send("No scores found");
      }
    }
  );
});

(async () => {
  try {
    app.listen(PORT, () =>
      console.log(`Listening on http://localhost:${PORT}`)
    );
    await startGame();
  } catch (error) {
    console.error("Failed to load words and start the server:", error);
  }
})();
