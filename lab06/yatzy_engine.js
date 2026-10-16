/**
 * YatzyEngine module: Yatzy rules, score calculation and the score table.
 */

// 15 scoring categories in scorecard order.
// Object.freeze() == read-only
export const UPPER_CATEGORIES = Object.freeze(['ones', 'twos', 'threes', 'fours', 'fives', 'sixes']);
export const LOWER_CATEGORIES = Object.freeze([
    'onePair', 'twoPairs', 'threeOfAKind', 'fourOfAKind', 'smallStraight', 'largeStraight', 'fullHouse', 'chance', 'yatzy'
])
export const CATEGORIES = Object.freeze([...UPPER_CATEGORIES, ...LOWER_CATEGORIES]);

const BONUS_THRESHOLD = 63; // upper section total needed for the bonus
const BONUS_POINTS = 50;
const DICE_COUNT = 5;

export class YatzyEngine {
    // Score table: one entry per category
    #scores;

    /**
     * Creates an engine with an empty score table
     */
    constructor() {
        this.reset();
    }

    /**
     * Clears the score table (start of a new game)
     */
    reset () {
        this.#scores = {};
        for (const category of CATEGORIES) {
            this.#scores[category] = null;
        }
    }

    /**
     * Calculate what a set of dice would score in a category.
     * Doesn't change the score table, so it can also be used to preview scores.
     * @param {string} category - one of CATEGORIES
     * @param {number[]} diceValues - five dice values from 1 to 6
     * @returns {number} the score (0 if the dice don't fit the category)
     */
    calculateScore(category, diceValues) {
        this.#checkCategory(category);
        this.#checkDice(diceValues);

        const counts = this.#countFaces(diceValues); // counts[4] = how many dice show 4
        const sum = diceValues.reduce((total, value) => total + value, 0);

        switch (category) {
            // upper section: sum of the dice showing that number
            case 'ones': return counts[1] * 1;
            case 'twos': return counts[2] * 2;
            case 'threes': return counts[3] * 3;
            case 'fours': return counts[4] * 4;
            case 'fives': return counts[5] * 5;
            case 'sixes': return counts[6] * 6;

            // lower section
            case 'onePair': {
                // Highest face with at least 2 dice
                const face = this.#highestFaceWith(counts, 2);
                return face * 2;
            }
            case 'twoPairs': {
                // Two different faces with at least 2 dice each
                const pairs = this.#facesWith(counts, 2);
                if (pairs.length < 2) return 0;
                return pairs[0] * 2 + pairs[1] * 2;
            }
            case 'threeOfAKind': return this.#highestFaceWith(counts, 3) * 3;
            case 'fourOfAKind':  return this.#highestFaceWith(counts, 4) * 4;
            case 'smallStraight': return this.#isSequence(counts, 1, 5) ? 15 : 0;
            case 'largeStraight': return this.#isSequence(counts, 2, 6) ? 20 : 0;
            case 'fullHouse': {
                // Exactly three of one face and two of another
                const hasThree = counts.includes(3);
                const hasTwo = counts.includes(2);
                return hasThree && hasTwo ? sum : 0;
            }
            case 'chance': return sum;
            case 'yatzy':  return counts.includes(5) ? 50 : 0;
        }
    }

    /**
     * Checks whether the player can score these dice in this category:
     * the category must exist and still be open, and the dice must be valid.
     * Scoring 0 in a category is still a valid selection
     * (how players "scratch" a category they can't fill).
     * @param {string} category - one of CATEGORIES
     * @param {number[]} diceValues - five dice values from 1 to 6
     * @returns {boolean} true if the selection is allowed
     */
    isValidSelection(category, diceValues) {
        try {
            this.#checkCategory(category);
            this.#checkDice(diceValues);
        } catch {
            return false;
        }
        return this.#scores[category] === null;
    }

    /**
     * Scores the dice in a category and saves it in the score table.
     * @param {string} category - one of CATEGORIES
     * @param {number[]} diceValues - five dice values from 1 to 6
     * @returns {number} the score that was recorded
     */
    recordScore(category, diceValues) {
        if (!this.isValidSelection(category, diceValues)) {
            throw new Error(`Cannot score in '${category}': it is already used or the selection is invalid`);
        }
        const score = this.calculateScore(category, diceValues);
        this.#scores[category] = score;
        return score;
    }

    // --- Getters ---

    /** @returns {Object<string, (number|null)>} a copy of the score table */
    get scoreTable() {
        return { ...this.#scores };
    }

    /** @returns {string[]} categories that haven't been scored yet */
    get openCategories() {
        return CATEGORIES.filter(category => this.#scores[category] === null);
    }

    /** @returns {boolean} true when all 15 categories are scored */
    get isComplete() {
        return this.openCategories.length === 0;
    }

    /** @returns {number} total of the upper section (ones to sixes) */
    get upperTotal() {
        return this.#sumOf(UPPER_CATEGORIES);
    }

    /** @returns {number} 50 if the upper total is 63 or more, otherwise 0 */
    get bonus() {
        return this.upperTotal >= BONUS_THRESHOLD ? BONUS_POINTS : 0;
    }

    /** @returns {number} total of the lower section */
    get lowerTotal() {
        return this.#sumOf(LOWER_CATEGORIES);
    }

    /** @returns {number} upper total + bonus + lower total */
    get total() {
        return this.upperTotal + this.bonus + this.lowerTotal;
    }

    // --- Private helpers ---

    /**
     * Counts how many dice show each face.
     * @param {number[]} diceValues 
     * @returns {number[]} index = face
     */
    #countFaces(diceValues) {
        const counts = [0, 0, 0, 0, 0, 0, 0]; // index 0 unused so counts[6] = sixes
        for (const value of diceValues) {
            counts[value]++;
        }
        return counts;
    }

    /**
     * Faces that appear at least `minimum` times, highest first.
     * @param {number[]} counts - from #countFaces 
     * @param {number} minimum 
     * @returns {number[]}
     */
    #facesWith(counts, minimum) {
        const faces = [];
        for (let face = 6; face >= 1; face--) {
            if (counts[face] >= minimum) faces.push(face);
        }
        return faces;
    }

    /**
     * highest face that appears at least `minimum` times.
     * @param {number[]} counts - from #countFaces
     * @param {number} minimum
     * @returns {number} the face, or 0 if none
     */
    #highestFaceWith(counts, minimum) {
        return this.#facesWith(counts, minimum)[0] ?? 0;
    }

    /**
     * True if every face from `start` to `end` appears exactly once.
     * @param {number[]} counts - from #countFaces 
     * @param {number} start 
     * @param {number} end 
     * @returns {boolean}
     */
    #isSequence(counts, start, end) {
        for (let face = start; face <= end; face++) {
            if (counts[face] !== 1) {
                return false;
            }
        }
        return true;
    }

    /**
     * Adds up the scored categories in a section (unscored ones count as 0).
     * @param {string[]} categories 
     * @returns {number}
     */
    #sumOf(categories) {
        return categories.reduce((total, category) => total + (this.#scores[category] ?? 0), 0);
    }

    /**
     * Throws an error if the category name isn't one of the 15.
     * @param {string} category 
     */
    #checkCategory(category) {
        if (!CATEGORIES.includes(category)) {
            throw new Error(`Unknown category '${category}'`);
        }
    }

    /**
     * Throws an error unless there are exactly 5 whole numbers from 1 to 6.
     * @param {number[]} diceValues 
     */
    #checkDice(diceValues) {
        const valid = Array.isArray(diceValues) && diceValues.length === DICE_COUNT && diceValues.every(value => Number.isInteger(value) && value >= 1 && value <= 6);
        if (!valid) {
            throw new Error(`Dice must be ${DICE_COUNT} whole numbers from 1 to 6, got ${JSON.stringify(diceValues)}`);
        }
    }

    
}