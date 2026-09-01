import { ArrowLeft, Dices, Gamepad2, Info, Sparkles, Trophy, Zap } from "lucide-react";
import { GAMES_LIST } from "../lib/games";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Avatar, Button, Card, Chip, EmptyState, SectionHeader } from "../components/ui";
import { useStore } from "../store/StoreProvider";
import type { GameScore } from "../lib/types";
import { cn } from "../utils/cn";
import { compact, timeAgo } from "../lib/utils";

type GameKey = GameScore["game"];

const GAMES = GAMES_LIST;

export function Games() {
  const { db, recordGame, pushToast } = useStore();
  const [active, setActive] = useState<GameKey | null>(null);
  const [busy, setBusy] = useState(false);

  const stats = useMemo(() => {
    const scores = db.scores;
    return {
      played: scores.length,
      wins: scores.filter((s) => s.result === "win").length,
      points: scores.reduce((sum, s) => sum + s.points, 0),
    };
  }, [db.scores]);

  function finish(game: GameKey, result: GameScore["result"], base: number) {
    const points = result === "win" ? base : result === "draw" ? Math.round(base / 3) : 0;
    recordGame(game, result, points);
    setBusy(true);
    window.setTimeout(() => {
      setBusy(false);
      pushToast(
        result === "win" ? `Victory — +${points} demo points${points ? " and coins" : ""}` : result === "draw" ? `Draw · +${points} demo points` : "No points this time. Run it back?",
        result === "lose" ? "info" : "ok",
      );
    }, 320);
  }

  return (
    <div className="space-y-6">
      <Card className="relative flex flex-wrap items-center gap-4 !rounded-[28px] p-5">
        <div className="vibe-gradient pointer-events-none absolute -right-16 -top-20 size-56 rounded-full opacity-25 blur-3xl" />
        <span className="grid size-14 shrink-0 place-items-center rounded-3xl bg-vibe-600/25 text-vibe-200 ring-1 ring-vibe-400/30">
          <Gamepad2 className="size-7" />
        </span>
        <div className="min-w-[200px] flex-1">
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Game lounge</h1>
          <p className="mt-1 text-sm text-white/55">
            Casual games to break the ice. Rewards are <strong className="text-white/80">demo points only</strong> —
            never cash, never withdrawable.
          </p>
        </div>
        <div className="flex gap-2">
          {[
            { label: "Played", value: stats.played },
            { label: "Wins", value: stats.wins },
            { label: "Points", value: compact(stats.points) },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-center">
              <p className="font-display text-lg font-extrabold leading-none">{s.value}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">{s.label}</p>
            </div>
          ))}
        </div>
      </Card>

      {!active && (
        <div className="grid gap-3.5 sm:grid-cols-2">
          {GAMES.map((g, i) => (
            <button
              key={g.key}
              onClick={() => setActive(g.key)}
              className="tap group relative flex items-center gap-4 overflow-hidden rounded-[28px] border border-white/10 bg-ink-900/60 p-5 text-left transition hover:-translate-y-1 hover:border-vibe-400/45"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="grid size-16 shrink-0 place-items-center rounded-3xl text-white shadow-[0_18px_40px_-18px_rgba(0,0,0,0.9)] transition group-hover:scale-105" style={{ backgroundImage: g.hue }}>
                <g.icon className="size-8" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-lg font-extrabold">{g.name}</span>
                <span className="mt-1 block text-xs text-white/50">{g.blurb}</span>
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-coin-500/15 px-2 py-0.5 text-[10px] font-black text-coin-400">
                  <Trophy className="size-3" /> up to {g.win} pts
                </span>
              </span>
              <Sparkles className="size-5 shrink-0 text-white/20 transition group-hover:text-vibe-200" />
            </button>
          ))}
        </div>
      )}

      {active && (
        <Card className="!rounded-[28px] p-4 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <button onClick={() => setActive(null)} className="tap inline-flex items-center gap-1.5 text-xs font-bold text-white/55 hover:text-white">
              <ArrowLeft className="size-4" /> All games
            </button>
            <Chip active className="pointer-events-none">Demo points</Chip>
          </div>
          {active === "tic-tac-toe" && <TicTacToe onFinished={(r) => finish("tic-tac-toe", r, 30)} busy={busy} />}
          {active === "rps" && <RockPaperScissors onFinished={(r) => finish("rps", r, 30)} />}
          {active === "memory" && <MemoryGame onFinished={(r, moves) => finish("memory", r, Math.max(20, 90 - moves * 3))} />}
          {active === "dice" && <DiceGame onFinished={(r) => finish("dice", r, 40)} />}
        </Card>
      )}

      <section>
        <SectionHeader title="Your recent matches" subtitle="Saved locally with your demo profile" icon={<Trophy className="size-4.5 text-coin-400" />} />
        {db.scores.length === 0 ? (
          <EmptyState icon={<Gamepad2 className="size-6" />} title="No matches yet" body="Play anything from the list above and your results show up here." />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {db.scores.slice(0, 6).map((s) => {
              const meta = GAMES.find((g) => g.key === s.game);
              return (
                <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                  <span className="grid size-9 place-items-center rounded-xl text-white" style={{ backgroundImage: meta?.hue }}>
                    {meta && <meta.icon className="size-4.5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold capitalize">{s.game.replace("-", " ")}</p>
                    <p className="text-[11px] text-white/40">{timeAgo(s.at)} ago</p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider",
                      s.result === "win" ? "bg-mint-400/15 text-mint-400" : s.result === "draw" ? "bg-white/10 text-white/60" : "bg-rose-500/15 text-rose-200",
                    )}
                  >
                    {s.result}
                  </span>
                  <span className="text-xs font-black text-coin-400">+{s.points}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <p className="flex items-start gap-2 text-[11px] leading-relaxed text-white/35">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        VibeTalk does not offer cash games, betting or withdrawals. Points here exist only to make the demo feel
        alive and are never convertible to money.
      </p>
    </div>
  );
}

/* -------------------------------- Tic tac toe ------------------------------- */

type Cell = "X" | "O" | null;
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

function winnerOf(b: Cell[]): Cell {
  for (const [a, c, d] of LINES) if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  return null;
}

function TicTacToe({ onFinished, busy }: { onFinished: (r: GameScore["result"]) => void; busy: boolean }) {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<"X" | "O">("X");
  const [status, setStatus] = useState<"playing" | "won" | "lost" | "draw">("playing");

  const cpuMove = useCallback((b: Cell[]) => {
    const empty = b.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
    for (const i of empty) {
      const copy = [...b];
      copy[i] = "O";
      if (winnerOf(copy) === "O") return i;
    }
    for (const i of empty) {
      const copy = [...b];
      copy[i] = "X";
      if (winnerOf(copy) === "X") return i;
    }
    if (empty.includes(4)) return 4;
    const corners = empty.filter((i) => [0, 2, 6, 8].includes(i));
    return corners.length ? corners[Math.floor(Math.random() * corners.length)] : empty[Math.floor(Math.random() * empty.length)];
  }, []);

  useEffect(() => {
    if (status !== "playing" || turn !== "O" || busy) return;
    const t = window.setTimeout(() => {
      if (winnerOf(board) || board.every(Boolean)) return;
      const move = cpuMove(board);
      const next = [...board];
      next[move] = "O";
      setBoard(next);
      const w = winnerOf(next);
      if (w === "O") {
        setStatus("lost");
        onFinished("lose");
      } else if (next.every(Boolean)) {
        setStatus("draw");
        onFinished("draw");
      } else {
        setTurn("X");
      }
    }, 480);
    return () => window.clearTimeout(t);
  }, [board, turn, status, busy, cpuMove, onFinished]);

  function play(i: number) {
    if (board[i] || status !== "playing" || turn !== "X") return;
    const next = [...board];
    next[i] = "X";
    setBoard(next);
    if (winnerOf(next) === "X") {
      setStatus("won");
      onFinished("win");
      return;
    }
    if (next.every(Boolean)) {
      setStatus("draw");
      onFinished("draw");
      return;
    }
    setTurn("O");
  }

  function reset() {
    setBoard(Array(9).fill(null));
    setTurn("X");
    setStatus("playing");
  }

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-center sm:gap-8">
      <div className="grid grid-cols-3 gap-2">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => play(i)}
            disabled={!!cell || status !== "playing" || turn !== "X"}
            className={cn(
              "tap grid size-[70px] place-items-center rounded-2xl border text-3xl font-black transition sm:size-20",
              cell === "X"
                ? "border-vibe-400/50 bg-vibe-600/25 text-vibe-200"
                : cell === "O"
                  ? "border-blush-400/50 bg-blush-500/20 text-blush-300"
                  : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.07] disabled:opacity-60",
            )}
          >
            <span className={cn("animate-pop", !cell && "text-white/10")}>{cell ?? "+"}</span>
          </button>
        ))}
      </div>

      <div className="w-full max-w-xs text-center sm:text-left">
        <p className="font-display text-xl font-extrabold">
          {status === "won" ? "You win 🎉" : status === "lost" ? "Bot wins" : status === "draw" ? "Stalemate" : turn === "X" ? "Your move (X)" : "Bot thinking…"}
        </p>
        <p className="mt-1 text-xs text-white/50">
          {status === "playing" ? "You're X. Grab a line of three before the bot locks you out." : "Result recorded to your demo profile."}
        </p>
        <div className="mt-4 flex items-center justify-center gap-2 sm:justify-start">
          <Button size="sm" onClick={reset} icon={<Zap className="size-3.5" />}>New round</Button>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/55">
            <Avatar seed="bot" size={18} /> VibeBot
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Rock paper scissors ------------------------------ */

const RPS = [
  { key: "rock", emoji: "✊", beats: "scissors" },
  { key: "paper", emoji: "✋", beats: "rock" },
  { key: "scissors", emoji: "✌️", beats: "paper" },
] as const;

function RockPaperScissors({ onFinished }: { onFinished: (r: GameScore["result"]) => void }) {
  const [you, setYou] = useState<string | null>(null);
  const [cpu, setCpu] = useState<string | null>(null);
  const [score, setScore] = useState({ you: 0, cpu: 0 });
  const [shaking, setShaking] = useState(false);

  function play(pick: (typeof RPS)[number]) {
    if (shaking) return;
    setShaking(true);
    setYou(null);
    setCpu(null);
    window.setTimeout(() => {
      const cpuPick = RPS[Math.floor(Math.random() * RPS.length)];
      setYou(pick.key);
      setCpu(cpuPick.key);
      setShaking(false);
      const youWin = pick.beats === cpuPick.key;
      const tie = pick.key === cpuPick.key;
      const next = { you: score.you + (youWin ? 1 : 0), cpu: score.cpu + (!youWin && !tie ? 1 : 0) };
      setScore(next);
      if (next.you === 2) onFinished("win");
      else if (next.cpu === 2) onFinished("lose");
      else if (tie) onFinished("draw");
    }, 620);
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-center gap-6">
        {RPS.map((r) => (
          <button
            key={r.key}
            onClick={() => play(r)}
            disabled={shaking}
            className="tap grid size-16 place-items-center rounded-3xl border border-white/10 bg-white/[0.04] text-4xl transition hover:-translate-y-1 hover:border-vibe-400/60 hover:bg-vibe-600/20 disabled:opacity-50 sm:size-20"
          >
            <span className={cn(shaking && "animate-float")}>{r.emoji}</span>
          </button>
        ))}
      </div>
      <div className="flex w-full max-w-md items-center justify-between rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-4">
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">You</p>
          <p className="font-display text-3xl font-extrabold text-vibe-200">{score.you}</p>
          <p className="mt-1 text-2xl">{you ? RPS.find((r) => r.key === you)?.emoji : "—"}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">First to 2</p>
          <p className="font-display text-sm font-black text-white/70">{shaking ? "shake…" : "best of 3"}</p>
          <p className="mt-1 text-[11px] text-white/40">tie = 10 pts</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">VibeBot</p>
          <p className="font-display text-3xl font-extrabold text-blush-300">{score.cpu}</p>
          <p className="mt-1 text-2xl">{cpu ? RPS.find((r) => r.key === cpu)?.emoji : "—"}</p>
        </div>
      </div>
      <Button size="sm" variant="ghost" onClick={() => setScore({ you: 0, cpu: 0 })}>Reset series</Button>
    </div>
  );
}

/* ----------------------------------- Memory ---------------------------------- */

const MEMORY_EMOJIS = ["🎧", "🎮", "🔥", "💜", "🌙", "🚀"];

function MemoryGame({ onFinished }: { onFinished: (r: GameScore["result"], moves: number) => void }) {
  const [deck, setDeck] = useState<{ id: number; emoji: string; open: boolean; done: boolean }[]>([]);
  const [picked, setPicked] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);

  const shuffle = useCallback(() => {
    const cards = [...MEMORY_EMOJIS, ...MEMORY_EMOJIS]
      .map((emoji, i) => ({ id: i, emoji, open: false, done: false }))
      .sort(() => Math.random() - 0.5);
    setDeck(cards);
    setPicked([]);
    setMoves(0);
    setElapsed(0);
    setRunning(true);
  }, []);

  useEffect(() => {
    shuffle();
  }, [shuffle]);

  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (deck.length === 0) return;
    if (picked.length !== 2) return;
    const [a, b] = picked.map((i) => deck[i]);
    setMoves((m) => m + 1);
    if (a.emoji === b.emoji) {
      const next = deck.map((c, i) => (i === picked[0] || i === picked[1] ? { ...c, done: true, open: true } : c));
      setDeck(next);
      setPicked([]);
      if (next.every((c) => c.done)) {
        setRunning(false);
        onFinished("win", moves + 1);
      }
    } else {
      const t = window.setTimeout(() => {
        setDeck((prev) => prev.map((c, i) => (i === picked[0] || i === picked[1] ? { ...c, open: false } : c)));
        setPicked([]);
        if (moves > 26) {
          setRunning(false);
          onFinished("lose", moves);
        }
      }, 720);
      return () => window.clearTimeout(t);
    }
  }, [picked, deck, moves, onFinished]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full max-w-md items-center justify-between text-xs">
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-bold text-white/70">Moves {moves}</span>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-bold text-white/70">
          {String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}
        </span>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-bold text-mint-400">
          {deck.filter((c) => c.done).length / 2}/6 pairs
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2.5">
        {deck.map((card, i) => {
          const shown = card.open || card.done;
          return (
            <button
              key={card.id}
              onClick={() => (shown || picked.length === 2 ? undefined : setPicked((p) => [...p, i]))}
              className={cn(
                "tap grid size-[68px] place-items-center rounded-2xl border text-3xl transition duration-200 sm:size-[76px]",
                card.done
                  ? "border-mint-400/50 bg-mint-400/12"
                  : shown
                    ? "border-vibe-400/60 bg-vibe-600/25"
                    : "border-white/10 bg-white/[0.04] hover:border-white/25",
              )}
              style={{ transformStyle: "preserve-3d" }}
            >
              <span className={cn("transition", shown ? "scale-100 opacity-100" : "scale-50 opacity-0")}>{shown ? card.emoji : ""}</span>
              {!shown && <span className="absolute text-lg font-black text-white/25">?</span>}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={shuffle} icon={<Zap className="size-3.5" />}>Shuffle & restart</Button>
        <span className="text-[11px] text-white/40">Under 26 moves to win</span>
      </div>
    </div>
  );
}

/* ------------------------------------ Dice ------------------------------------ */

const FACE = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

function DiceGame({ onFinished }: { onFinished: (r: GameScore["result"]) => void }) {
  const [mine, setMine] = useState([1, 1, 1]);
  const [host, setHost] = useState([1, 1, 1]);
  const [rolling, setRolling] = useState(false);
  const [streak, setStreak] = useState(0);

  function roll() {
    if (rolling) return;
    setRolling(true);
    let ticks = 0;
    const spin = window.setInterval(() => {
      ticks += 1;
      const r = [1, 2, 3].map(() => 1 + Math.floor(Math.random() * 6));
      setMine(r);
      if (ticks > 8) {
        window.clearInterval(spin);
        const finalMine = [1, 2, 3].map(() => 1 + Math.floor(Math.random() * 6));
        const finalHost = [1, 2, 3].map(() => 1 + Math.floor(Math.random() * 6));
        setMine(finalMine);
        setHost(finalHost);
        setRolling(false);
        const a = finalMine.reduce((x, y) => x + y, 0);
        const b = finalHost.reduce((x, y) => x + y, 0);
        if (a > b) {
          setStreak((s) => s + 1);
          onFinished("win");
        } else if (a < b) {
          setStreak(0);
          onFinished("lose");
        } else {
          onFinished("draw");
        }
      }
    }, 90);
  }

  const myTotal = mine.reduce((a, b) => a + b, 0);
  const hostTotal = host.reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="grid w-full max-w-lg gap-3 sm:grid-cols-2">
        {[
          { label: "You", dice: mine, total: myTotal, tone: "border-vibe-400/40 bg-vibe-600/15" },
          { label: "Host", dice: host, total: hostTotal, tone: "border-blush-400/40 bg-blush-500/12" },
        ].map((side) => (
          <div key={side.label} className={cn("rounded-3xl border p-4 text-center", side.tone)}>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">{side.label}</p>
            <div className="mt-2 flex justify-center gap-2">
              {side.dice.map((d, i) => (
                <span key={i} className={cn("text-5xl leading-none transition", rolling && "animate-float")} style={{ animationDelay: `${i * 80}ms` }}>
                  {FACE[d]}
                </span>
              ))}
            </div>
            <p className="mt-2 font-display text-3xl font-extrabold">{side.total}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={roll} disabled={rolling} icon={<Dices className="size-4" />}>
          {rolling ? "Rolling…" : "Roll three"}
        </Button>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-white/60">
          Win streak {streak}
        </span>
      </div>
      <p className="max-w-sm text-center text-[11px] leading-relaxed text-white/35">
        Highest total wins 40 demo points. No coins are wagered — this is a friendly roll, not gambling.
      </p>
    </div>
  );
}
