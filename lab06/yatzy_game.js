/**
 * yatzy_game.js
 * YatzyGame module: manages the state of a game (players, rounds, turns and totals).
 * Uses Dice for rolling and YatzyEngine for scoring
 */

import { Dice } from "./dice.js";
import { CATEGORIES, YatzyEngine } from "./yatzy_engine.js";

const MAX_ROLLS = 3;
const TOTAL_ROUNDS = CATEGORIES.length;

export class YatzyGame {
  #players; // [{ name, engine }, ...] one scorecard per player
  #playerIndex; // whose turn it is (index into #players)
  #round; // current round, 1-15
  #rollsUsed; // rolls used this turn, 0-3
  #isOver; // true once endGame() has run
  #dice; // the five dice shared by all players

  /**
   * Creates a game and starts it
   * @param {string[]} playerNames - one name per player
   */
  constructor(playerNames = ["Player 1"]) {
    this.#dice = new Dice();
    this.startNewGame(playerNames);
  }

  /**
   * Initializes a new game: fresh scorecards, round 1, first player's turn.
   * @param {string[]} playerNames - one name per player (defaults to the current players)
   */
  startNewGame(playerNames = this.#players?.map((player) => player.name)) {
    if (!Array.isArray(playerNames) || playerNames.length === 0) {
      throw new Error("A game needs at least one player");
    }
    this.#players = playerNames.map((name) => ({
      name,
      engine: new YatzyEngine(),
    }));
    this.#playerIndex = 0;
    this.#round = 1;
    this.#rollsUsed = 0;
    this.#isOver = false;
    this.#dice.reset();
  }

  /**
   * Rolls every die that isn't held (up to 3 rolls per turn).
   * @returns {number[]} the dice values after the roll
   */
  roll() {
    this.#checkInProgress();
    if (this.#rollsUsed >= MAX_ROLLS) {
      throw new Error(`No rolls left this turn (maximum ${MAX_ROLLS})`);
    }
    this.#rollsUsed++;
    return this.#dice.rollAll();
  }

  /**
   * Holds or releases one die between rolls.
   * @param {number} index - position of the die (0-4)
   * @returns {boolean} the die's new held state
   */
  toggleHold(index) {
    this.#checkInProgress();
    return this.#dice.toggleHold(index);
  }

  /**
   * Ends the current player's turn: scores the dice in the chosen category,
   * resets the dice and passes the turn to the next player. After the last
   * player, the round goes up; after round 15, the game ends.
   * @param {string} category - the category to score in
   * @returns {number} the score recorded for this turn
   */
  endTurn(category) {
    this.#checkInProgress();
    if (this.#rollsUsed === 0) {
      throw new Error("Roll the dice at least once before ending the turn");
    }
    const score = this.#currentEngine.recordScore(category, this.#dice.values);

    // Reset for the next turn
    this.#dice.reset();
    this.#rollsUsed = 0;

    // Next player; after the last player, start the next round
    this.#playerIndex++;
    if (this.#playerIndex === this.#players.length) {
      this.#playerIndex = 0;
      this.#round++;
    }

    if (this.#round > TOTAL_ROUNDS) {
      this.endGame();
    }
    return score;
  }

  /**
   * Determines the winner and finalizes the game.
   * Called automatically after round 15, but can also be called early
   * @returns {{winners: string[], standings: { name: string, total: number }[] }}
   * winners has more than one name if there's a tie
   */
  endGame() {
    this.#isOver = true;
    const standings = this.standings;
    const topScore = standings[0].total;
    const winners = standings
      .filter((player) => player.total === topScore)
      .map((player) => player.name);
    return { winners, standings };
  }

  // --- Getters ---

  /**
   * @returns {string} name of the player whose turn it is
   */
  get currentPlayer() {
    return this.#players[this.#playerIndex].name;
  }

  /**
   * @returns {number} the current round (1-15)
   */
  get currentRound() {
    return Math.min(this.#round, TOTAL_ROUNDS);
  }

  /**
   * @returns {number} the current player's total score (including the bonus)
   */
  get totalScore() {
    return this.#currentEngine.total;
  }

  /**
   * @returns {Object<string, (number|null)>} the current player's score table
   */
  get scoreTable() {
    return this.#currentEngine.scoreTable;
  }

  /**
   * What the current dice would score in each open category (for showing previews).
   * @returns {Object<string, number>} e.g. { fours: 12, chance: 20, ... }; empty before the first roll
   */
  get previewScores() {
    if (this.#rollsUsed === 0) return {};
    const preview = {};
    for (const category of this.#currentEngine.openCategories) {
      preview[category] = this.#currentEngine.calculateScore(
        category,
        this.#dice.values,
      );
    }
    return preview;
  }

  /**
   * @returns {(number|null)[]} current dice values
   */
  get diceValues() {
    return this.#dice.values;
  }

  /**
   * @returns {boolean[]} which dice are held
   */
  get heldDice() {
    return this.#dice.held;
  }

  /**
   * @returns {number} rolls left this turn (0-3)
   */
  get rollsLeft() {
    return MAX_ROLLS - this.#rollsUsed;
  }

  /**
   * @returns {boolean} true once the game has ended
   */
  get isOver() {
    return this.#isOver;
  }

  /**
   * @returns {{ name: string, total: number }[]} every player's total, highest first
   */
  get standings() {
    return this.#players
      .map((player) => ({ name: player.name, total: player.engine.total }))
      .sort((a, b) => b.total - a.total);
  }

  // --- Private helpers ---

  /**
   * @returns {YatzyEngine} the scorecard of the player whose turn it is
   */
  get #currentEngine() {
    return this.#players[this.#playerIndex].engine;
  }

  /**
   * Throws an error if the game has already ended
   */
  #checkInProgress() {
    if (this.#isOver) {
      throw new Error("The game is over. Call startNewGame() to play again");
    }
  }
}
