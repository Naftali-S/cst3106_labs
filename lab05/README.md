# Yatzy Game Design Documentation

This document is the design system for my Yatzy game: the rules, colours, typography, dice design and HTML/CSS mock-ups that the game will be built from in the later labs.

**Design direction:** a high-end casino table. Deep green felt, ivory dice, and gold accents used sparingly. The game should feel calm and premium.

---

## 1. Game Overview

Yatzy is a dice game that mixes luck and strategy. The player rolls five dice to make combinations, and each combination scores in one box on the scorecard. There are 15 boxes on the scorecard, so a game lasts 15 rounds. The goal is to finish with the highest total score.

## 2. Rules

### Turns

- On each turn, the player can roll the dice **up to three times**.
- After each roll, the player can **hold** any dice and re-roll the rest.
- After the last roll (or earlier, if they choose), the player **must** score the dice in one empty box on the scorecard. If the dice don't fit any combination, they score 0 in a box of their choice.
- Each box can only be used once.

### Upper Section

| Box | Score |
| --- | ----- |
| Ones - Sixes | Sum of the dice showing that number |
| **Bonus** | **+50** if the upper section totals 63 or more |

### Lower Section

| Box | Requirement | Score |
| --- | ----------- | ----- |
| One Pair | Two dice the same | Sum of the pair |
| Two Pairs | Two different pairs | Sum of both pairs |
| Three of a Kind | Three dice the same | Sum of those three |
| Four of a Kind | Four dice the same | Sum of those four |
| Small Straight | 1-2-3-4-5 | 15 |
| Large Straight | 2-3-4-5-6 | 20 |
| Full House | A three of a kind plus a pair | Sum of all dice |
| Chance | Anything | Sum of all dice |
| Yatzy | All five dice the same | 50 |

### End of Game

The game ends when all 15 boxes are filled. The final score is the upper section, plus the bonus, plus the lower section.

---

## 3. Design System

### Colour Palette

All colours will be defined once as CSS custom properties (design tokens) in `:root` and used everywhere through `var()`, so the whole theme can be adjusted from one place.

#### Primary Colours: the Table

| Token | Hex | Role |
| --- | --- | --- |
| `--color-felt` | `#0B3D2E` | Deep emerald. The main game board (the felt table). |
| `--color-felt-dark` | `#06261C` | Near-black green. Table edge, header bar and the text on gold buttons. |
| `--color-ivory` | `#FAF7F0` | Dice faces. The brightest thing on the screen, so the eye goes to the dice first. |
| `--color-pip` | `#1C1C1C` | Charcoal. The dots (pips) on the dice. |

#### Secondary Colours: Accents and the Scorecard

| Token | Hex | Role |
| --- | --- | --- |
| `--color-gold` | `#C9A227` | Muted gold. Game title and the Roll button. |
| `--color-brass` | `#A8862B` | Antique brass. Scorecard border and dividers. |
| `--color-oxblood` | `#6B1E2E` | Deep burgundy. Highlights held dice and the Yatzy row. |
| `--color-parchment` | `#E6D9BC` | Aged parchment. Scorecard background. |
| `--color-ink` | `#2E2418` | Sepia ink. Scorecard text. |
| `--color-rule` | `#BFAE8A` | Faded tan. Lines between scorecard rows. |

#### Why These Colours

- **High-end casino feel.** Green felt, ivory dice and gold trim are what people picture at a real casino table. Keeping the gold muted (instead of a bright yellow) makes it feel expensive instead of flashy.
- **Aged scorecard.** Aged parchment with sepia ink and brass trim looks like an old ledger. It's softer against the dark felt than a bright white or cream would be, so it's easier on the eyes.
- **Clear hierarchy.** The ivory dice are the brightest element, the parchment scorecard is second, and the felt stays in the background. The player's attention goes where the action is.
- **Oxblood for state.** Held dice and the Yatzy row need to stand out without breaking the theme. A deep burgundy fits the casino look better than a typical bright red or blue.

### Typography

All three fonts are free on Google Fonts.

| Use | Font | Fallback | Style |
| --- | --- | --- | --- |
| **Headings** (game title, section titles, buttons) | Cinzel | Georgia, serif | Uppercase, letter-spaced, gold or felt green |
| **Subheadings** (round/roll status, Bonus label) | Cormorant Garamond | Georgia, serif | Italic |
| **Body text and scores** | Inter | Arial, sans-serif | Regular, with `font-variant-numeric: tabular-nums` |

#### Why These Fonts

- **Cinzel** is based on classic Roman inscriptions. Its engraved capitals look like the lettering on casino signs and old playing cards, so it sets the theme immediately.
- **Cormorant Garamond (italic)** is an elegant serif that pairs with Cinzel. It's used for short status lines ("Round 4 of 15 · Roll 2 of 3") where a softer, handwritten-looking style fits.
- **Inter** keeps the scorecard and instructions easy to read. Decorative serifs are hard to scan in a table full of numbers, so the actual data uses a clean sans-serif. Tabular numbers make every digit the same width, so the score columns line up.
