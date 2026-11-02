/**
 * dice.js
 * Dice module: dice values and held state.
 * The random values come from the server (GET /roll-dices), not the browser.
 */

const SIDES = 6;
const DEFAULT_COUNT = 5;
const ROLL_URL = "/roll-dices";
const REQUEST_TIMEOUT_MS = 5000; // stop if takes longer than 5 seconds

export class Dice {
  // Private fields
  #values; // current face of each die; null = not rolled
  #held; // Boolean for each die
  #count; // number of dice

  /**
   * Creates the dice
   * @param {number} count - number of dice
   */
  constructor(count = DEFAULT_COUNT) {
    if (!Number.isInteger(count) || count < 1) {
      throw new RangeError(
        `Number of dice must be a whole number of 1 or more, got ${count}`,
      );
    }
    this.#count = count;
    this.reset();
  }

  /**
   * Rolls every die that is not held. The server rolls all five dice;
   * only the values for dice that aren't held are used.
   * If the request fails, the dice keep their old values.
   * @returns {Promise<number[]>} a copy of the dice values after the roll
   * @throws {Error} with a message that can be shown to the player
   */
  async rollAll() {
    const serverValues = await this.#fetchRoll();

    for (let i = 0; i < this.count; i++) {
      if (!this.#held[i]) {
        this.#values[i] = serverValues[i];
      }
    }
    return this.values;
  }

  /**
   * Holds or releases one die
   * @param {number} index - position of the die (0-4)
   * @returns {boolean} the die's new held state
   */
  toggleHold(index) {
    this.#checkIndex(index);
    if (this.#values[index] === null) {
      throw new Error(`Cannot hold a die before it has been rolled`);
    }
    this.#held[index] = !this.#held[index];
    return this.#held[index];
  }

  /**
   *  Checks whether a die is held.
   * @param {number} index - position of the die (0-4)
   * @returns {boolean} whether the die at this index is held
   */
  isHeld(index) {
    this.#checkIndex(index);
    return this.#held[index];
  }

  /**
   * Clears all values and releases all holds (start of a new turn)
   */
  reset() {
    this.#values = Array(this.count).fill(null);
    this.#held = Array(this.count).fill(false);
  }

  /**
   * Current dice values. Returns a copy, so code outside this class
   * can read the values but can't change them.
   * @returns {(number|null)[]}
   */
  get values() {
    return [...this.#values];
  }

  /**
   * @returns {boolean[]} a copy of the held state for each die
   */
  get held() {
    return [...this.#held];
  }

  get count() {
    return this.#count;
  }

  /**
   * Private helper: stops invalid indexes like -1 or 7
   * @param {number} index - position to check
   */
  #checkIndex(index) {
    if (!Number.isInteger(index) || index < 0 || index >= this.count) {
      throw new RangeError(
        `Die index must be 0-${this.count - 1}, got ${index}`,
      );
    }
  }

  /**
   * Private helper: asks the server for five new dice values.
   * @returns {Promise<number[]>} the values from the server
   * @throws {Error} if the server can't be reached or sends bad data
   */
  async #fetchRoll() {
    let response;
    try {
      response = await fetch(ROLL_URL, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      throw new Error(
        "Couldn't reach the dice server. Check that it's running, then roll again.",
        { cause: error },
      );
    }

    if (!response.ok) {
      throw new Error(
        `The dice server had a problem (error ${response.status}). Roll again.`,
      );
    }

    let data;
    try {
      data = await response.json();
    } catch (error) {
      throw new Error("The dice server sent back something that isn't dice values.", {
        cause: error,
      });
    }

    if (!this.#isValidRoll(data)) {
      throw new Error("The dice server sent back invalid dice values. Roll again.");
    }
    return data;
  }

  /**
   * Private helper: checks the server sent one whole number from 1 to 6 per die.
   * @param {*} data - the parsed response
   * @returns {boolean}
   */
  #isValidRoll(data) {
    if (!Array.isArray(data) || data.length !== this.count) {
      return false;
    }
    return data.every(
      (value) => Number.isInteger(value) && value >= 1 && value <= SIDES,
    );
  }
}
