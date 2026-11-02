/**
 * main.js
 * Connects the YatzyGame class to the page. It reads the game state,
 * updates the HTML and handles the player's clicks.
 */

import { YatzyGame } from "./yatzy_game.js";
import { CATEGORIES } from "./yatzy_engine.js";

// --- Page elements ---
const diceButtons = document.querySelectorAll(".die");
const rollButton = document.getElementById("roll-btn");
const endTurnButton = document.getElementById("end-turn-btn");
const messageText = document.getElementById("message");
const roundStatus = document.getElementById("round-status");
const rollsLeftBox = document.getElementById("rolls-left");
const rollMarkers = rollsLeftBox.querySelectorAll(".roll-marker");
const scoreRows = document.querySelectorAll("tr[data-category]");
const upperTotalCell = document.getElementById("upper-total");
const bonusCell = document.getElementById("bonus");
const lowerTotalCell = document.getElementById("lower-total");
const grandTotalCell = document.getElementById("grand-total");
const endGameButton = document.getElementById("end-game-btn");
const gameOverDialog = document.getElementById("game-over");
const finalScoreText = document.getElementById("final-score");
const finalMessageText = document.getElementById("final-message");
const newGameButton = document.getElementById("new-game-btn");

// pip positions
const PIP_LAYOUTS = {
  1: ["c"],
  2: ["tr", "bl"],
  3: ["tr", "c", "bl"],
  4: ["tl", "tr", "bl", "br"],
  5: ["tl", "tr", "c", "bl", "br"],
  6: ["tl", "tr", "ml", "mr", "bl", "br"],
};

// --- Game State ---
const game = new YatzyGame();
let selectedCategory = null;

// --- Drawing the page ---

/**
 * Updates everything on the page from the game state.
 * @param {number[]} rolledIndexes - dice that were just rolled
 */
function render(rolledIndexes = []) {
  renderDice(rolledIndexes);
  renderRollsLeft();
  renderControls();
  renderScorecard();
}

/**
 * Draws the five dice: pips, held state and screen reader label.
 * @param {number[]} rolledIndexes - dice that were just rolled
 */
function renderDice(rolledIndexes = []) {
  const values = game.diceValues;
  const held = game.heldDice;

  diceButtons.forEach((button, i) => {
    const value = values[i];
    const dieNumber = i + 1;

    if (value === null) {
      // Not rolled yet
      button.replaceChildren();
      button.setAttribute("aria-label", `Die ${dieNumber}, not rolled`);
    } else {
      // Swap the old pips for the pips of the new value
      const pips = PIP_LAYOUTS[value].map(createPip);
      button.replaceChildren(...pips);

      let label = `Die ${dieNumber} showing ${value}`;
      if (held[i]) {
        label += ", kept";
      }
      button.setAttribute("aria-label", label);
    }

    button.classList.toggle("held", held[i]);
    button.disabled = value === null || game.isOver;

    // pressed tells screen readers this is an on/off (kept/not kept) button
    button.setAttribute("aria-pressed", held[i]);

    if (rolledIndexes.includes(i)) {
      button.classList.add("rolling"); // removed again when the animation ends
    }
  });
}

/**
 * Creates one pip for a die.
 * @param {string} position - pip position class from styles.css
 * @returns {HTMLSpanElement}
 */
function createPip(position) {
  const pip = document.createElement("span");
  pip.className = `pip ${position}`;
  return pip;
}

/**
 * Fills one gold marker per roll still available
 */
function renderRollsLeft() {
  const rollsLeft = game.rollsLeft;
  rollMarkers.forEach((marker, i) => {
    marker.classList.toggle("available", i < rollsLeft);
  });

  let label = `${rollsLeft} rolls left`;
  if (rollsLeft === 1) {
    label = "1 roll left";
  }
  rollsLeftBox.setAttribute("aria-label", label);
}

/**
 * Turns the buttons on or off and updates the round number.
 */
function renderControls() {
  rollButton.disabled = game.rollsLeft === 0 || game.isOver;
  endTurnButton.disabled = selectedCategory === null || game.isOver;
  roundStatus.textContent = `Round ${game.currentRound} of ${CATEGORIES.length}`;

  // Once the game is over, the End Game link starts a new game instead
  if (game.isOver) {
    endGameButton.textContent = "New game";
  } else {
    endGameButton.textContent = "End game";
  }
}

/**
 * Draws the scorecard: scored boxes, previews for open boxes,
 * the selected box and the totals
 */
function renderScorecard() {
  const scores = game.scoreTable;
  const previews = game.previewScores; // empty before the first roll

  scoreRows.forEach((row) => {
    const category = row.dataset.category;
    const cell = row.querySelector(".score");

    // Start from a clean row, then add back the classes that apply
    row.classList.remove("open", "filled", "selected");
    cell.classList.remove("preview");

    if (scores[category] !== null) {
      // Already scored: show the locked-in score
      row.classList.add("filled");
      row.removeAttribute("tabindex"); // can't be chosen again
      cell.textContent = scores[category];
    } else if (category in previews && !game.isOver) {
      // Open this turn: show what the dice would score
      row.classList.add("open");
      row.tabIndex = 0; // reachable with Tab
      cell.classList.add("preview");
      cell.textContent = previews[category];

      if (category === selectedCategory) {
        row.classList.add("selected");
      }
    } else {
      // Not scored, and no roll yet this turn
      row.removeAttribute("tabindex");
      cell.textContent = "";
    }
  });

  upperTotalCell.textContent = game.upperTotal;
  bonusCell.textContent = game.bonus;
  lowerTotalCell.textContent = game.lowerTotal;
  grandTotalCell.textContent = game.totalScore;
}

/**
 * Gets a box's name from its scorecard row.
 * @param {HTMLTableRowElement} row
 * @returns {string}
 */
function categoryName(row) {
  return row.cells[0].firstChild.textContent.trim();
}

/**
 * Writes a score as "1 point" or "12 points".
 * @param {number} points
 * @returns {string}
 */
function pointsText(points) {
  if (points === 1) {
    return "1 point";
  }
  return `${points} points`;
}

/**
 * Shows a prompt in the message bar.
 * @param {string} text
 */
function showMessage(text) {
  messageText.textContent = text;
}

/**
 * Opens the game over pop-up with the final score and a message.
 */
function showGameOver() {
  const total = game.totalScore;
  finalScoreText.textContent = total;
  finalMessageText.textContent = finalMessage(total);
  showMessage(`Game over. Your final score is ${pointsText(total)}.`);
  gameOverDialog.showModal();
}

/**
 * Congratulates or consoles the player based on their final score.
 * @param {number} total - the final score
 * @returns {string}
 */
function finalMessage(total) {
  const roundsPlayed = CATEGORIES.length - countOpenBoxes();

  let message;
  if (total >= 250) {
    message = "Outstanding! That's a high-roller's score.";
  } else if (total >= 200) {
    message = "Great game! The dice were on your side.";
  } else if (total >= 150) {
    message = "Nicely played. A solid score.";
  } else {
    message = "Tough luck with the dice this time. Try again?";
  }

  if (roundsPlayed < CATEGORIES.length) {
    message = `You ended the game after ${roundsPlayed} of ${CATEGORIES.length} rounds. ${message}`;
  }
  return message;
}

/**
 * Counts the scorecard boxes that haven't been scored yet.
 * @returns {number}
 */
function countOpenBoxes() {
  return Object.values(game.scoreTable).filter((score) => score === null).length;
}

// --- Event handlers ---

/**
 * Roll Dice: rolls every die that isn't kept.
 */
function handleRoll() {
  // The dice that aren't held are those that get rolled
  const rolledIndexes = [];
  game.heldDice.forEach((isHeld, i) => {
    if (!isHeld) rolledIndexes.push(i);
  });

  try {
    game.roll();
  } catch (error) {
    showMessage(error.message);
    return;
  }
  selectedCategory = null; // Dice change so player chooses again
  render(rolledIndexes);
  showMessage(rollMessage());
}

/**
 * The prompt to show after a roll, based on how many rolls are left.
 * @returns {string}
 */
function rollMessage() {
  switch (game.rollsLeft) {
    case 2:
      return "Click any dice you want to keep, then roll again.";
    case 1:
      return "One roll left. Roll again, or choose a box to score.";
    default:
      return "No rolls left. Choose a box on the scorecard, then press End Turn.";
  }
}

/**
 * Clicking a die keeps it (or releases it) from the next roll.
 * @param {MouseEvent} event
 */
function handleDieClick(event) {
  const index = Number(event.currentTarget.dataset.index);
  try {
    game.toggleHold(index);
  } catch (error) {
    showMessage(error.message);
    return;
  }
  renderDice();
}

/**
 * Clicking an open scorecard box selects it (clicking it again unselects it).
 * The score isn't recorded until the player presses End Turn.
 * @param {Event} event
 */
function handleScoreClick(event) {
  const row = event.currentTarget;
  if (!row.classList.contains("open")) {
    return; // already scored, or no roll yet
  }

  const category = row.dataset.category;
  if (selectedCategory === category) {
    selectedCategory = null;
    showMessage("Choose a box to score, then press End Turn.");
  } else {
    selectedCategory = category;
    const points = game.previewScores[category];
    showMessage(
      `${categoryName(row)} for ${pointsText(points)}. Press End Turn to score it.`,
    );
  }

  renderScorecard();
  renderControls();
}

/**
 * Lets keyboard players select a box with Enter or Space.
 * @param {KeyboardEvent} event
 */
function handleScoreKey(event) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault(); // Stop Space from scrolling the page
    handleScoreClick(event);
  }
}

/**
 * End Turn: records the selected box and moves on to the next round.
 */
function handleEndTurn() {
  if (selectedCategory === null) {
    return;
  }

  const row = document.querySelector(`tr[data-category="${selectedCategory}"]`);
  let score;
  try {
    score = game.endTurn(selectedCategory);
  } catch (error) {
    showMessage(error.message);
    return;
  }

  selectedCategory = null;
  render();

  // After the last round, YatzyGame ends the game by itself
  if (game.isOver) {
    showGameOver();
    return;
  }
  showMessage(
    `${categoryName(row)}: ${pointsText(score)}. Roll the dice to start round ${game.currentRound}.`,
  );
}

/**
 * End Game: lets the player stop early after confirming.
 * Once the game is over the same link starts a new game.
 */
function handleEndGame() {
  if (game.isOver) {
    handleNewGame();
    return;
  }

  const confirmed = confirm("End the game now? Your current score will be your final score.");
  if (!confirmed) {
    return;
  }

  game.endGame();
  selectedCategory = null;
  render();
  showGameOver();
}

/**
 * Play Again / New Game: resets everything for a new game.
 */
function handleNewGame() {
  game.startNewGame();
  selectedCategory = null;
  gameOverDialog.close();
  render();
  showMessage("New game. Roll the dice to start your turn.");
}

// --- Event listeners ---

rollButton.addEventListener("click", handleRoll);

endTurnButton.addEventListener("click", handleEndTurn);
endGameButton.addEventListener("click", handleEndGame);
newGameButton.addEventListener("click", handleNewGame);

scoreRows.forEach((row) => {
  row.addEventListener("click", handleScoreClick);
  row.addEventListener("keydown", handleScoreKey);
});

diceButtons.forEach((button) => {
  button.addEventListener("click", handleDieClick);
  // Remove the tumble class when it finishes, so it can play again next roll
  button.addEventListener("animationend", () => {
    button.classList.remove("rolling");
  });
});

// Draw the starting state
render();
