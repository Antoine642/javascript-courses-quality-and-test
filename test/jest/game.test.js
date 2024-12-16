const Game = require('../../game');
const tools = require('../../tools');
const db = require('../../database');
const fs = require('fs');

jest.mock('../../tools');
jest.mock('../../database');

describe('Game', () => {
  let game;

  beforeEach(() => {
    game = new Game();
    tools.getRandomInt.mockReturnValue(0);
    db.get.mockImplementation((query, params, callback) => {
      callback(null, null);
    });
    db.run.mockImplementation((query, params, callback) => {
      callback(null);
    });
  });

  afterEach(() => {
    game.stopScoring();
  });

  test("should initialize the game", async () => {
    await game.intialize();
    expect(game.word).not.toBeNull();
    expect(game.unknowWord).toEqual("#".repeat(game.word.length));
    expect(game.score).toBe(1000);
    expect(game.numberOfTry).toBe(5);
    expect(game.gameStatus).toBe("playing");
  });

  test("should handle correct and incorrect guesses", async () => {
    await game.intialize();
    const correctLetter = game.word[0];
    const incorrectLetter = "z";

    let result = game.guess(correctLetter);
    expect(result).toBe(true);
    expect(game.unknowWord.includes(correctLetter)).toBe(true);

    result = game.guess(incorrectLetter);
    expect(result).toBe(false);
    expect(game.numberOfTry).toBe(4);
    expect(game.score).toBe(950);
  });

  test("should handle game win scenario", async () => {
    await game.intialize();
    for (const letter of game.word) {
      game.guess(letter);
    }
    expect(game.gameStatus).toBe("won");
  });

  test("should handle game loss scenario", async () => {
    await game.intialize();
    for (let i = 0; i < 5; i++) {
      game.guess("z");
    }
    expect(game.gameStatus).toBe("lost");
  });

  test("should reset the game", async () => {
    await game.intialize();
    game.guess("z");
    await game.reset();
    expect(game.numberOfTry).toBe(5);
    expect(game.score).toBe(1000);
    expect(game.gameStatus).toBe("playing");
  });

  test("should return correct game status, number of tries, score, and chosen letters", async () => {
    await game.intialize();
    expect(game.getGameStatus()).toBe("playing");
    expect(game.getNumberOfTries()).toBe(5);
    expect(game.getScore()).toBe(1000);

    game.guess("a");
    expect(game.getChosenLetters()).toBe("a");
  });

  test("should handle invalid input and game over scenarios", async () => {
    await game.intialize();
    expect(() => game.guess("1")).toThrow(
      "Invalid input. Only letters are allowed."
    );

    for (let i = 0; i < 5; i++) {
      game.guess("z");
    }
    const result = game.guess("a");
    expect(result).toBe(false);
  });

  test("should handle invalid characters in word and database errors", async () => {
    game.listOfWords = ["invalid1"];
    db.get.mockImplementation((query, params, callback) => {
      callback(null, null);
    });
    await expect(game.intialize()).rejects.toThrow(
      "Invalid characters in word. Only letters are allowed."
    );

    db.get.mockImplementation((query, params, callback) => {
      callback(new Error("Database error"));
    });
    await expect(game.intialize()).rejects.toThrow("Database error");
  });

  test("should print the unknown word", async () => {
    await game.intialize();
    expect(game.print()).toBe(game.unknowWord);
  });

  test("should check if game is over (won)", async () => {
    await game.intialize();
    for (const letter of game.word) {
      game.guess(letter);
    }
    expect(game.isGameOver()).toBe(true);
  });

  test("should check if game is over (lost)", async () => {
    await game.intialize();
    for (let i = 0; i < 5; i++) {
      game.guess("z");
    }
    expect(game.isGameOver()).toBe(true);
  });

  test("should check if game is not over", async () => {
    await game.intialize();
    expect(game.isGameOver()).toBe(false);
  });

  test("should handle repeated guesses and case sensitivity", async () => {
    await game.intialize();
    const letter = game.word[0];
    game.guess(letter);
    const initialScore = game.score;
    game.guess(letter);
    expect(game.score).toBe(initialScore);

    const upperCaseLetter = game.word[0].toUpperCase();
    const result = game.guess(upperCaseLetter);
    expect(result).toBe(true);
    expect(game.unknowWord.includes(letter)).toBe(true);
  });

  test("should handle scoring over time and reset scenarios", async () => {
    jest.useFakeTimers();
    await game.intialize();
    jest.advanceTimersByTime(5000); // Advance time by 5 seconds
    expect(game.score).toBe(995);
    jest.useRealTimers();

    jest.useFakeTimers();
    await game.intialize();
    jest.advanceTimersByTime(5000); // Advance time by 5 seconds
    await game.reset();
    const scoreAfterReset = game.score;
    jest.advanceTimersByTime(5000); // Advance time by another 5 seconds
    expect(game.score).toBe(scoreAfterReset - 5);
    jest.useRealTimers();
  });

  test("should throw error if no words are available to choose from", async () => {
    jest.spyOn(game, "loadWords").mockImplementation(() => {
      game.listOfWords = [];
      return Promise.resolve();
    });
    await expect(game.intialize()).rejects.toThrow(
      "No words available to choose from."
    );
  });

  test("should throw error if word has not been set", async () => {
    await game.intialize();
    game.word = null;
    expect(() => game.guess("a")).toThrow(
      "The word has not been set. Please ensure that the game has been initialized properly."
    );
  });

  test("should handle database error when choosing word", async () => {
    db.get.mockImplementation((query, params, callback) => {
      callback(new Error("Database error"));
    });
    await expect(game.chooseWord()).rejects.toThrow("Database error");
  });

  test("should handle invalid characters in chosen word", async () => {
    game.listOfWords = ["invalid1"];
    tools.getRandomInt.mockReturnValue(0);
    await expect(game.chooseWord()).rejects.toThrow(
      "Invalid characters in word. Only letters are allowed."
    );
  });

  test("should handle empty list of words when choosing word", async () => {
    game.listOfWords = [];
    await expect(game.chooseWord()).rejects.toThrow(
      "No words available to choose from."
    );
  });

  test("should handle scoring over time", async () => {
    jest.useFakeTimers();
    await game.intialize();
    jest.advanceTimersByTime(10000); // Advance time by 10 seconds
    expect(game.score).toBe(990);
    jest.useRealTimers();
  });

  test("should handle stopping scoring", async () => {
    jest.useFakeTimers();
    await game.intialize();
    game.stopScoring();
    jest.advanceTimersByTime(10000); // Advance time by 10 seconds
    expect(game.score).toBe(1000); // Score should not change after stopping
    jest.useRealTimers();
  });

  test("should return chosen letters as a string", async () => {
    await game.intialize();
    game.guess("a");
    game.guess("b");
    expect(game.getChosenLetters()).toBe("a, b");
  });

  test("should choose a word from the list of words", async () => {
    game.listOfWords = ["apple", "banana", "cherry"];
    tools.getRandomInt.mockReturnValue(1); // Mock to choose 'banana'
    await game.chooseWord();
    expect(game.word).toBe("banana");
    expect(game.unknowWord).toBe("######");
  });

  test("should throw error if chosen word contains invalid characters", async () => {
    game.listOfWords = ["invalid1"];
    tools.getRandomInt.mockReturnValue(0);
    await expect(game.chooseWord()).rejects.toThrow(
      "Invalid characters in word. Only letters are allowed."
    );
  });

  test("should throw error if no words are available to choose from", async () => {
    game.listOfWords = [];
    await expect(game.chooseWord()).rejects.toThrow(
      "No words available to choose from."
    );
  });

  test("should choose word from database if available", async () => {
    const today = new Date().toISOString().split("T")[0];
    db.get.mockImplementation((query, params, callback) => {
      callback(null, { word: "databaseWord" });
    });
    await game.chooseWord();
    expect(game.word).toBe("databaseWord");
    expect(game.unknowWord).toBe("############");
  });

  test("should handle database error when choosing word", async () => {
    db.get.mockImplementation((query, params, callback) => {
      callback(new Error("Database error"));
    });
    await expect(game.chooseWord()).rejects.toThrow("Database error");
  });

  test("should insert chosen word into database if not already present", async () => {
    const today = new Date().toISOString().split("T")[0];
    game.listOfWords = ["apple"];
    tools.getRandomInt.mockReturnValue(0);
    db.get.mockImplementation((query, params, callback) => {
      callback(null, null);
    });
    db.run.mockImplementation((query, params, callback) => {
      callback(null);
    });
    await game.chooseWord();
    expect(game.word).toBe("apple");
    expect(game.unknowWord).toBe("#####");
    expect(db.run).toHaveBeenCalledWith(
      "INSERT INTO word_of_the_day (date, word) VALUES (?, ?)",
      [today, "apple"],
      expect.any(Function)
    );
  });

  //test should return won if this.word is equal to this.unknowWord
  test("should return won if this.word is equal to this.unknowWord", async () => {
    await game.intialize();
    game.word = "apple";
    game.unknowWord = "apple";
    expect(game.getGameStatus()).toBe("won");
  });

  test("should handle database error when inserting word of the day", async () => {
    const today = new Date().toISOString().split("T")[0];
    game.listOfWords = ["apple"];
    tools.getRandomInt.mockReturnValue(0);
    db.get.mockImplementation((query, params, callback) => {
      callback(null, null);
    });
    db.run.mockImplementation((query, params, callback) => {
      callback(new Error("Database error"));
    });
    await expect(game.chooseWord()).rejects.toThrow("Database error");
  });

  // test if (this.numberOfTry <= 0) return lost
  test("should return lost if this.numberOfTry <= 0", async () => {
    await game.intialize();
    game.numberOfTry = 0;
    expect(game.getGameStatus()).toBe("lost");
  });
});
