import { Brain, Dices, Grid3X3, Hand } from "lucide-react";
import type { GameScore } from "./types";

export interface GameMeta {
  key: GameScore["game"];
  name: string;
  blurb: string;
  icon: typeof Dices;
  win: number;
  hue: string;
}

export const GAMES_LIST: GameMeta[] = [
  {
    key: "tic-tac-toe",
    name: "Tic-Tac-Toe",
    blurb: "Classic 3×3 vs the VibeTalk bot. Win = 30 pts.",
    icon: Grid3X3,
    win: 30,
    hue: "linear-gradient(140deg,#7c3aed,#ec4899)",
  },
  {
    key: "rps",
    name: "Rock Paper Scissors",
    blurb: "Best of three. Read the bot's mood.",
    icon: Hand,
    win: 30,
    hue: "linear-gradient(140deg,#2563eb,#a855f7)",
  },
  {
    key: "memory",
    name: "Memory Match",
    blurb: "Find all six pairs. Fewer moves = more points.",
    icon: Brain,
    win: 60,
    hue: "linear-gradient(140deg,#db2777,#fb923c)",
  },
  {
    key: "dice",
    name: "Dice Duel",
    blurb: "Roll three dice, beat the host's total.",
    icon: Dices,
    win: 40,
    hue: "linear-gradient(140deg,#059669,#8b5cf6)",
  },
];
