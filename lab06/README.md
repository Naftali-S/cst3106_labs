# Lab 6: Yatzy Game Modules

This lab builds the JavaScript structure for the Yatzy game design in the Lab 5. The game is split into three ES modules, each with on responsibility. Only the core logic is implemented at this stage; game-flow methods are documented stubs that will be completed in Assignment 1.

---

## 1. Review and Refinment

### What exists so far

- **Lab 5 mock-up:** static HTML/CSS dice. Each face is hard-coded in the html with pip classes (`tl`, `c`, `br`, ...), and states like `held` are added by hand.

### Refinements for the game

| Issue | Refinement |
| --- | --- |
| Dice faces are hard-coded in HTML | Store each die's **value** in JS and generate the pips from it |
| `held` only exists as a CSS class | Keep held state in the `Dice` module; the page only reflects it |
| The sprite roller has no text value | Screen readers can't read an image. Keep the value in data and update each due's `aria-label` |
| Roll Logic, scoring and DOM code mixed in one script | Split into three modules with no DOM code inside them |
| Rolling animation always plays | Respect `prefers-reduced-motion` when the animation is added |

---

## 2. Design Decisions

### Core components

- **Dice:** 5 six-sided dice.
- **Rolls:** 15 rounds, one per scoring category.
- **Players:** the game supports one or more players; the mock-up shows a single-player game.

### Scoring categories (15)

| Section | Category | Score |
| --- | --- | --- |
| Upper | Ones - Sixes | Sum of the dice showing that number |
| Upper | Bonus | 50 if the upper section totals 63 or  more |
| Lower | One Pair | Sum of the highest pair |
| Lower | Two Pairs | Sum of two different pairs |
| Lower | Three of a Kind | Sum of the three matching dice |
| Lower | Four of a kind | Sum of the four matching dice |
| Lower | Small Straight | 1-2-3-4-5 scores 15 |
| Lower | Large Straight | 2-3-4-5-6 scores 20 |
| Lower | Full House | Three of a kind + a pair: sum of all dice |
| Lower | Chance | Sum of all dice |
| Lower | Yatzy | Five of a kind scores 50 |

### Game flow

1. `startNewGame()` resets the scorecard, round counter and players.
2. The player rolls the dice (up to 3 times), holding any dice between rolls.
3. The player picks an open category. The engine checks the selection and calculates the score.
4. `endTurn()` records the score, resets the dice and moves to the next player (and the next round after the last player).
5. After 15 rounds, `endGame()` adds the upper bonus, totals the scores and determines the winner.

### Why modularize

Each module has one job and doesn't know about the page:

| Module | Responsibility | Depends on |
| --- | --- | --- |
| `Dice` (`dice.js`) | Rolling, dice values, held state | nothing |
| `YatzyEngine` (`yatzy_engine.js`) | Rules, score calculation, score table | nothing |
| `YatzyGame` (`yatzy_game.js`) | Game state: players, rounds, turns, totals | `Dice`, `YatzyEngine` |

- **Easier to test:** `calculateScore('fullHouse', [3,3,3,5,5])` can be checked in the console without clicking through a game.
- **Easier to change:** switching from Yatzy to Yahtzee rules only touches `YatzyEngine`.
- **Easier to read:** each file is short, and its `import` lines show exactly what it relies on.
- **Separation from the UI:** none of the modules touch the DOM, so the same logic can be run behind any interface in Assignment 1.