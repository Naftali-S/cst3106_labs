/**
 * yatzy_test.js
 * Tests for the Dice, YatzyEngine and YatzyGame modules.
 */

import { Dice } from "./dice.js";
import { CATEGORIES, YatzyEngine } from "./yatzy_engine.js";
import { YatzyGame } from "./yatzy_game.js";

let passed = 0;
let failed = 0;

/**
 * Prints PASS or FAIL for one check.
 * @param {string} description - what is being tested
 * @param {boolean} condition - true if the test passed
 */
function check(description, condition) {
  if (condition) {
    passed++;
    console.log(`  PASS  ${description}`);
  } else {
    failed++;
    console.log(`  FAIL  ${description}`);
  }
}

/**
 * Passes if calling fn throws an error.
 * @param {string} description - what is being tested
 * @param {Function} fn - code that should throw
 */
function checkThrows(description, fn) {
  try {
    fn();
    check(description, false);
  } catch {
    check(description, true);
  }
}

/**
 * Compares two arrays value by value.
 * @param {any[]} a
 * @param {any[]} b
 * @returns {boolean} true if both arrays have the same values in the same order
 */
function sameArray(a, b) {
  return a.length === b.length && a.every((value, i) => value === b[i]);
}

/**
 * Runs code with Math.random() always returning the same number,
 * so dice rolls are predictable. 0 rolls a 1, 0.99 rolls a 6.
 * @param {number} value - what Math.random() should return
 * @param {Function} fn - code to run
 */
function withRandom(value, fn) {
  const realRandom = Math.random;
  Math.random = () => value;
  try {
    fn();
  } finally {
    Math.random = realRandom;
  }
}

// ---------------------------------------------------------------- Dice
console.log("\nDice");
{
  const dice = new Dice();
  check("starts with 5 dice", dice.count === 5);
  check("starts unrolled (all null)", dice.values.every((v) => v === null));
  check("starts with nothing held", dice.held.every((h) => h === false));

  // roll() should only ever give 1-6, and every face should show up
  const seen = new Set();
  let inRange = true;
  for (let i = 0; i < 1000; i++) {
    const value = dice.roll();
    if (!Number.isInteger(value) || value < 1 || value > 6) inRange = false;
    seen.add(value);
  }
  check("roll() always returns a whole number from 1 to 6", inRange);
  check("roll() can return every face 1-6", seen.size === 6);

  const values = dice.rollAll();
  check("rollAll() returns 5 values", values.length === 5);
  check("rollAll() fills every die", values.every((v) => v >= 1 && v <= 6));

  // Holding a die keeps its value on the next roll
  const heldValue = dice.values[2];
  check("toggleHold() holds a die", dice.toggleHold(2) === true);
  check("isHeld() reports the hold", dice.isHeld(2) === true);
  for (let i = 0; i < 20; i++) dice.rollAll();
  check("held die keeps its value after 20 rolls", dice.values[2] === heldValue);
  check("toggleHold() again releases it", dice.toggleHold(2) === false);

  // values and held are copies, so changing them doesn't change the dice
  const copy = dice.values;
  copy[0] = 99;
  check("values returns a copy", dice.values[0] !== 99);

  dice.reset();
  check("reset() clears values", dice.values.every((v) => v === null));
  check("reset() clears holds", dice.held.every((h) => h === false));

  check("custom dice count works", new Dice(3).count === 3);
  checkThrows("rejects 0 dice", () => new Dice(0));
  checkThrows("rejects 2.5 dice", () => new Dice(2.5));
  checkThrows("can't hold before rolling", () => new Dice().toggleHold(0));
  checkThrows("rejects index 5", () => dice.isHeld(5));
  checkThrows("rejects index -1", () => dice.isHeld(-1));
  checkThrows("count can't be changed from outside", () => {
    dice.count = 10;
  });
}

// ---------------------------------------------------------- YatzyEngine
console.log("\nYatzyEngine: scoring");
{
  const engine = new YatzyEngine();

  // [category, dice, expected score]
  const cases = [
    ["ones", [1, 1, 2, 3, 1], 3],
    ["threes", [3, 3, 3, 1, 2], 9],
    ["sixes", [6, 6, 1, 2, 3], 12],
    ["fives", [1, 2, 3, 4, 6], 0],
    ["onePair", [3, 3, 5, 5, 1], 10], // highest pair counts
    ["onePair", [1, 2, 3, 4, 6], 0],
    ["twoPairs", [3, 3, 5, 5, 1], 16],
    ["twoPairs", [4, 4, 4, 4, 1], 0], // four of a kind is not two pairs
    ["twoPairs", [2, 2, 2, 6, 6], 16], // full house still contains two pairs
    ["threeOfAKind", [4, 4, 4, 1, 2], 12],
    ["threeOfAKind", [4, 4, 1, 2, 3], 0],
    ["fourOfAKind", [2, 2, 2, 2, 5], 8],
    ["fourOfAKind", [6, 6, 6, 6, 6], 24], // yatzy counts as four of a kind
    ["smallStraight", [1, 2, 3, 4, 5], 15],
    ["smallStraight", [5, 3, 1, 4, 2], 15], // order doesn't matter
    ["smallStraight", [2, 3, 4, 5, 6], 0],
    ["smallStraight", [1, 6, 6, 6, 6], 0],
    ["largeStraight", [2, 3, 4, 5, 6], 20],
    ["largeStraight", [1, 2, 3, 4, 5], 0],
    ["fullHouse", [2, 2, 3, 3, 3], 13],
    ["fullHouse", [2, 2, 2, 2, 3], 0],
    ["fullHouse", [4, 4, 4, 4, 4], 0], // yatzy is not a full house
    ["chance", [1, 3, 4, 5, 6], 19],
    ["yatzy", [5, 5, 5, 5, 5], 50],
    ["yatzy", [5, 5, 5, 5, 4], 0],
  ];
  for (const [category, dice, expected] of cases) {
    const actual = engine.calculateScore(category, dice);
    check(
      `${category} with [${dice}] = ${expected}` +
        (actual === expected ? "" : ` (got ${actual})`),
      actual === expected,
    );
  }

  checkThrows("unknown category throws", () =>
    engine.calculateScore("bigStraight", [1, 2, 3, 4, 5]),
  );
  checkThrows("4 dice throws", () => engine.calculateScore("chance", [1, 2, 3, 4]));
  checkThrows("a 7 throws", () => engine.calculateScore("chance", [1, 2, 3, 4, 7]));
  checkThrows("unrolled dice (null) throw", () =>
    engine.calculateScore("chance", [null, null, null, null, null]),
  );
  check("calculateScore() doesn't touch the score table", engine.openCategories.length === 15);
}

console.log("\nYatzyEngine: score table and totals");
{
  const engine = new YatzyEngine();
  check("15 categories", CATEGORIES.length === 15);
  check("score table starts empty", Object.values(engine.scoreTable).every((s) => s === null));

  check("open category is a valid selection", engine.isValidSelection("chance", [1, 2, 3, 4, 5]));
  check("scoring 0 (scratching) is still valid", engine.isValidSelection("yatzy", [1, 2, 3, 4, 5]));
  check("bad category is not valid", !engine.isValidSelection("nope", [1, 2, 3, 4, 5]));
  check("bad dice are not valid", !engine.isValidSelection("chance", [1, 2, 3]));

  check("recordScore() returns the score", engine.recordScore("chance", [6, 6, 6, 5, 5]) === 28);
  check("score is saved in the table", engine.scoreTable.chance === 28);
  check("used category is no longer valid", !engine.isValidSelection("chance", [1, 2, 3, 4, 5]));
  checkThrows("can't score the same category twice", () =>
    engine.recordScore("chance", [1, 2, 3, 4, 5]),
  );

  const table = engine.scoreTable;
  table.ones = 99;
  check("scoreTable returns a copy", engine.scoreTable.ones === null);

  // Bonus: three of each upper face = 3+6+9+12+15+18 = 63
  for (let face = 1; face <= 6; face++) {
    const category = CATEGORIES[face - 1];
    engine.recordScore(category, [face, face, face, 1 + (face % 6), 1 + ((face + 1) % 6)]);
  }
  check("upper total is 63", engine.upperTotal === 63);
  check("bonus is 50 at 63", engine.bonus === 50);
  check("lower total is 28", engine.lowerTotal === 28);
  check("total = 63 + 50 + 28 = 141", engine.total === 141);
  check("not complete yet", !engine.isComplete);

  const low = new YatzyEngine();
  low.recordScore("sixes", [6, 6, 6, 6, 1]); // 24
  check("no bonus under 63", low.bonus === 0);

  engine.reset();
  check("reset() empties the table", engine.openCategories.length === 15 && engine.total === 0);
}

// ------------------------------------------------------------ YatzyGame
console.log("\nYatzyGame: turns");
{
  const game = new YatzyGame(["Alice", "Bob"]);
  check("starts on round 1", game.currentRound === 1);
  check("Alice goes first", game.currentPlayer === "Alice");
  check("3 rolls to start", game.rollsLeft === 3);
  check("total starts at 0", game.totalScore === 0);
  check("no previews before rolling", Object.keys(game.previewScores).length === 0);
  checkThrows("can't end a turn without rolling", () => game.endTurn("chance"));

  game.roll();
  check("one roll used", game.rollsLeft === 2);
  check("previews for all 15 open categories", Object.keys(game.previewScores).length === 15);

  game.toggleHold(0);
  check("hold shows in heldDice", game.heldDice[0] === true);
  game.roll();
  game.roll();
  checkThrows("can't roll a 4th time", () => game.roll());

  const expected = game.diceValues.reduce((sum, v) => sum + v, 0);
  check("endTurn() returns the score", game.endTurn("chance") === expected);
  check("turn passes to Bob", game.currentPlayer === "Bob");
  check("still round 1", game.currentRound === 1);
  check("rolls reset to 3", game.rollsLeft === 3);
  check("dice reset", game.diceValues.every((v) => v === null));
  check("Bob's scorecard is separate", game.scoreTable.chance === null);

  game.roll();
  game.endTurn("chance");
  check("back to Alice", game.currentPlayer === "Alice");
  check("round 2", game.currentRound === 2);
  check("Alice's chance score was kept", game.scoreTable.chance === expected);

  game.roll();
  checkThrows("can't reuse a category", () => game.endTurn("chance"));
}

console.log("\nYatzyGame: full game");
{
  // Every roll is a 6 for Alice and a 1 for Bob, so the result is predictable
  const game = new YatzyGame(["Alice", "Bob"]);
  let result;
  for (let turn = 0; turn < 30; turn++) {
    const open = Object.keys(game.scoreTable).filter((c) => game.scoreTable[c] === null);
    withRandom(game.currentPlayer === "Alice" ? 0.99 : 0, () => game.roll());
    game.endTurn(open[0]);
  }
  check("game is over after 15 rounds", game.isOver);
  check("round stays at 15", game.currentRound === 15);
  checkThrows("can't roll after the game ends", () => game.roll());

  result = game.endGame();
  // Alice (all 6s): sixes 30 + bonus 0 (upper 30) + onePair 12 + threeOfAKind 18
  //   + fourOfAKind 24 + chance 30 + yatzy 50 = 164
  // Bob (all 1s): ones 5 + onePair 2 + threeOfAKind 3 + fourOfAKind 4 + chance 5 + yatzy 50 = 69
  check("Alice wins", sameArray(result.winners, ["Alice"]));
  check("Alice scores 164", result.standings[0].total === 164);
  check("Bob scores 69", result.standings[1].total === 69);

  game.startNewGame();
  check("startNewGame() keeps the players", game.currentPlayer === "Alice");
  check("startNewGame() resets the round", game.currentRound === 1 && !game.isOver);
  check("startNewGame() clears scores", game.standings.every((p) => p.total === 0));
}

console.log("\nYatzyGame: tie");
{
  const game = new YatzyGame(["Alice", "Bob"]);
  withRandom(0, () => {
    for (let turn = 0; turn < 30; turn++) {
      const open = Object.keys(game.scoreTable).filter((c) => game.scoreTable[c] === null);
      game.roll();
      game.endTurn(open[0]);
    }
  });
  const result = game.endGame();
  check("tie gives two winners", sameArray(result.winners, ["Alice", "Bob"]));
  checkThrows("a game needs at least one player", () => new YatzyGame([]));
}

// ------------------------------------------------------------- Summary
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0 && globalThis.process) process.exitCode = 1;
