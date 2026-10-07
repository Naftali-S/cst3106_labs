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
