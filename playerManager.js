const sqlite3 = require("sqlite3").verbose();
const db = require("./database.js");

class PlayerManager {
  constructor() {
    // Plus besoin de Map, on utilise SQLite
  }

  async recordPlay(playerId) {
    const now = new Date().toISOString();
    return new Promise((resolve, reject) => {
      db.run(
        "INSERT OR REPLACE INTO players (playerId, lastPlayTime) VALUES (?, ?)",
        [playerId, now],
        (err) => {
          if (err) {
            console.error("Error recording play time:", err);
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async getNextPlayTime(playerId) {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT lastPlayTime FROM players WHERE playerId = ?",
        [playerId],
        (err, row) => {
          if (err) {
            console.error("Error getting next play time:", err);
            return reject(err);
          }
          if (!row) {
            return resolve(new Date());
          }
          const lastPlayTime = new Date(row.lastPlayTime);
          const nextPlayTime = new Date(lastPlayTime);
          nextPlayTime.setDate(nextPlayTime.getDate() + 1);
          nextPlayTime.setHours(0, 0, 0, 0);
          resolve(nextPlayTime);
        }
      );
    });
  }

  async createPlayer() {
    const playerId = Math.random().toString(36).substring(2, 15);
    const now = new Date().toISOString();
    return new Promise((resolve, reject) => {
      db.run(
        "INSERT INTO players (playerId, lastPlayTime) VALUES (?, ?)",
        [playerId, now],
        (err) => {
          if (err) {
            console.error("Error creating player:", err);
            reject(err);
          } else {
            resolve(playerId);
          }
        }
      );
    });
  }

  async canPlayerPlay(playerId) {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT lastPlayTime FROM players WHERE playerId = ?",
        [playerId],
        (err, row) => {
          if (err) {
            console.error("Error checking if player can play:", err);
            return reject(err);
          }
          if (!row) {
            return resolve(true);
          }
          const lastPlayTime = new Date(row.lastPlayTime);
          const now = new Date();
          const canPlay =
            lastPlayTime.getDate() !== now.getDate() ||
            lastPlayTime.getMonth() !== now.getMonth() ||
            lastPlayTime.getFullYear() !== now.getFullYear();
          resolve(canPlay);
        }
      );
    });
  }
}

module.exports = PlayerManager;