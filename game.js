const tools = require('./tools.js');
const csv = require('csv-parser');
const fs = require('fs');
const db = require('./database.js');

class Game {
  constructor() {
    this.listOfWords = [];
    this.numberOfTry = 5;
    this.word = null; // word to guess
    this.unknowWord = null; // word with # instead of letters
    this.score = 1000;
    this.startTime = null;
    this.intervalId = null;
    this.gameStatus = "playing";
    this.chosenLetters = new Set();
  }
  // Load words from a file and choose one
  async intialize() {
    // Ensure loadWords is called and check its result
    await this.loadWords();

    // Explicitly check if listOfWords is empty
    if (!this.listOfWords || this.listOfWords.length === 0) {
      throw new Error("No words available to choose from.");
    }

    // Only proceed if words are available
    await this.chooseWord();
    this.startScoring();
  }

  loadWords() {
    return new Promise((resolve, reject) => {
      fs.createReadStream("./words_fr.txt")
        .pipe(csv())
        .on("data", (row) => {
          this.listOfWords.push(row.word.toLowerCase());
        })
        .on("end", () => {
          console.log("CSV file successfully processed");
          // this.chooseWord();
          resolve();
        })
        .on("error", reject);
    });
  }

  async chooseWord() {
    return new Promise((resolve, reject) => {
      const today = new Date().toISOString().split("T")[0];
      db.get(
        "SELECT word FROM word_of_the_day WHERE date = ?",
        [today],
        (err, row) => {
          if (err) {
            return reject(err);
          }
          if (row) {
            this.word = row.word;
            this.unknowWord = this.word.replace(/./g, "#");
            resolve();
          } else {
            if (this.listOfWords.length > 0) {
              this.word =
                this.listOfWords[tools.getRandomInt(this.listOfWords.length)];
              if (!/^[a-zA-Z]+$/.test(this.word)) {
                return reject(
                  new Error(
                    "Invalid characters in word. Only letters are allowed."
                  )
                );
              }
              this.unknowWord = "#".repeat(this.word.length);
              db.run(
                "INSERT INTO word_of_the_day (date, word) VALUES (?, ?)",
                [today, this.word],
                (err) => {
                  if (err) {
                    return reject(err);
                  }
                  resolve();
                }
              );
            } else {
              return reject(new Error("No words available to choose from."));
            }
          }
        }
      );
    });
  }

  startScoring() {
    this.startTime = new Date();
    this.intervalId = setInterval(() => {
      this.score = Math.max(0, this.score - 1);
    }, 1000);
  }

  stopScoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  guess(oneLetter) {
    console.log("guess word: ", this.word);
    console.log("guess unknowWord: ", this.unknowWord);
    if (!/^[a-zA-Z]$/.test(oneLetter)) {
      throw new Error("Invalid input. Only letters are allowed.");
    }
    if (this.gameStatus !== "playing") {
      return false;
    }

    if (!this.word) {
      throw new Error(
        "The word has not been set. Please ensure that the game has been initialized properly."
      );
    }
    oneLetter = oneLetter.toLowerCase();
    this.chosenLetters.add(oneLetter);

    if (this.word.includes(oneLetter)) {
      console.log("guess: " + oneLetter);
      for (let i = 0; i < this.word.length; i++) {
        if (this.word[i] === oneLetter) {
          // this.unknowWord = tools.replaceAt(this.unknowWord, i, oneLetter);
          this.unknowWord =
            this.unknowWord.substring(0, i) +
            oneLetter +
            this.unknowWord.substring(i + 1); // pour les test pas possible d'utiliser tools.replaceAt
        }
      }
      if (this.unknowWord === this.word) {
        this.gameStatus = "won";
        this.stopScoring();
      }
      console.log("guess: " + this.unknowWord);
      return true;
    }
    this.numberOfTry--;
    this.score = Math.max(0, this.score - 50); // Deduct 50 points for each incorrect try
    if (this.numberOfTry <= 0) {
      this.gameStatus = "lost";
      this.stopScoring();
    }
    return false;
  }

  print() {
    return this.unknowWord;
  }

  async reset() {
    this.stopScoring();
    this.numberOfTry = 5;
    this.score = 1000;
    await this.chooseWord();
    this.gameStatus = "playing";
    this.chosenLetters = new Set();
    this.startScoring();
    return this.numberOfTry;
  }

  isGameOver() {
    return (
      this.numberOfTry <= 0 ||
      !this.unknowWord.includes("#") ||
      this.score === 0
    );
  }

  getNumberOfTries() {
    return this.numberOfTry;
  }

  getScore() {
    return this.score;
  }

  getGameStatus() {
    if (this.unknowWord === this.word) {
      return "won";
    }
    if (this.numberOfTry <= 0) {
      return "lost";
    }
    return "playing";
  }

  getChosenLetters() {
    return Array.from(this.chosenLetters).join(", ");
  }
}

module.exports = Game;
