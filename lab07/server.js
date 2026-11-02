/**
 * server.js
 * Express server for the Yatzy game.
 * - Serves the game (HTML, CSS, client JS) from the public folder
 * - Rolls the dice: GET /roll-dices returns five random dice values
 */

const path = require("path");
const express = require("express");

const app = express();
const PORT = 3000;

const DICE_COUNT = 5;
const SIDES = 6;

// Serve index.html, css, and js from the public folder
app.use(express.static(path.join(__dirname, "public")));

/**
 * Rolls a single die. (Moved here from the Dice class's roll().)
 * @returns {number} a random whole number from 1 to 6
 */
function rollDie() {
    return Math.floor(Math.random() * SIDES) + 1;
}

/**
 * Rolls all five dice.
 * @returns {number[]} five random dice values, e.g. [3, 6, 1, 1, 4]
 */
function rollDice() {
    const values = Array(DICE_COUNT);
    for (let i = 0; i < DICE_COUNT; i++) {
        values[i] = rollDie();
    }
    return values;
}

// GET /roll-dices -> [3, 6, 1, 1, 4]
app.get("/roll-dices", (req, res) => {
    const values = rollDice();
    console.log(`Rolled: ${values.join(", ")}`);
    res.json(values);
});

app.listen(PORT, () => {
    console.log(`Yatzy server running at http://localhost:${PORT}`);
});
