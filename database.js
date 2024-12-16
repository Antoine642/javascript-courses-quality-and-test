const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('game.db');

db.serialize(() => {
  // si score n'existe pas, on le crée
  db.get(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='scores'",
    (err, result) => {
      if (err) {
        console.error("Error checking if scores table exists:", err);
      } else {
        if (!result) {
          db.run(
            "CREATE TABLE scores (id INTEGER PRIMARY KEY, playerId TEXT, score INTEGER, timestamp TEXT)",
            (err) => {
              if (err) {
                console.error("Error creating scores table:", err);
              }
            }
          );
        } else {
          // Add timestamp column if it doesn't exist
          db.all("PRAGMA table_info(scores)", (err, columns) => {
            if (err) {
              console.error("Error retrieving table info:", err);
            } else {
              const hasTimestamp = Array.isArray(columns) && columns.some(column => column.name === 'timestamp');
              if (!hasTimestamp) {
                db.run("ALTER TABLE scores ADD COLUMN timestamp TEXT", (err) => {
                  if (err) {
                    console.error("Error adding timestamp column:", err);
                  }
                });
              }
            }
          });
        }
      }
    }
  );

  // si word n'existe pas, on le crée
  db.get(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='word_of_the_day'",
    (err, result) => {
      if (err) {
        console.error("Error checking if word_of_the_day table exists:", err);
      } else {
        if (!result) {
          db.run(
            "CREATE TABLE word_of_the_day (id INTEGER PRIMARY KEY, date TEXT, word TEXT)",
            (err) => {
              if (err) {
                console.error("Error creating word_of_the_day table:", err);
              }
            }
          );
        }
      }
    }
  );

  // si players n'existe pas, on le crée
  db.get(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='players'",
    (err, result) => {
      if (err) {
        console.error("Error checking if players table exists:", err);
      } else {
        if (!result) {
          db.run(
            "CREATE TABLE players (id INTEGER PRIMARY KEY, playerId TEXT, lastPlayTime TEXT)",
            (err) => {
              if (err) {
                console.error("Error creating players table:", err);
              }
            }
          );
        }
      }
    }
  )
});

module.exports = db;