import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback
} from "react";

import { bosses } from "../data/bosses";
import { playerLines } from "../data/playerLines";

export default function GameScreen({
  selectedBook,
  bossHP,
  playerHP,
  question,
  onAnswer,
  gameStatus,
  onRestart
}) {
  /* ---------------- BOSS DATA ---------------- */
  const boss = useMemo(() => {
    return (
      bosses[selectedBook] || {
        name: "Mysterious Boss",
        emoji: "👹",
        intro: "Prepare for battle!",
        taunts: ["Tick... tock..."],
        hitLines: ["You dare?"],
        defeat: "Impossible...",
        victory: "You were no match."
      }
    );
  }, [selectedBook]);

  /* ---------------- LOCAL STATE ---------------- */
  const [input, setInput] = useState("");
  const [dialogue, setDialogue] = useState(boss.intro);
  const [bossHit, setBossHit] = useState(false);
  const [playerHit, setPlayerHit] = useState(false);
  const [rumble, setRumble] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  /* ---------------- REFS ---------------- */
  const intervalRef = useRef(null);
  const onAnswerRef = useRef(onAnswer);
  const bossRef = useRef(boss);

  const tickSoundRef = useRef(null);
  const timeUpSoundRef = useRef(null);

  /* Keep refs updated */
  useEffect(() => {
    onAnswerRef.current = onAnswer;
  }, [onAnswer]);

  useEffect(() => {
    bossRef.current = boss;
  }, [boss]);

  /* Initialize sounds once */
  useEffect(() => {
    tickSoundRef.current = new Audio("/sounds/tick.mp3");
    tickSoundRef.current.volume = 0.3;

    timeUpSoundRef.current = new Audio("/sounds/timeup.mp3");
    timeUpSoundRef.current.volume = 0.5;
  }, []);

  /* ---------------- HIT EFFECTS ---------------- */
  const triggerBossHit = useCallback(() => {
    setBossHit(true);
    setDialogue(
      playerLines.correct[
        Math.floor(Math.random() * playerLines.correct.length)
      ]
    );
    setRumble(true);

    setTimeout(() => {
      setBossHit(false);
      setRumble(false);
    }, 300);
  }, []);

  const triggerPlayerHit = useCallback(() => {
    setPlayerHit(true);
    setDialogue(
      playerLines.wrong[
        Math.floor(Math.random() * playerLines.wrong.length)
      ]
    );
    setRumble(true);

    setTimeout(() => {
      setPlayerHit(false);
      setRumble(false);
    }, 300);
  }, []);

  /* ---------------- TIMER INTERVAL EFFECT ---------------- */
  useEffect(() => {
    if (gameStatus !== "playing") {
      clearInterval(intervalRef.current);
      return;
    }

    clearInterval(intervalRef.current);

    // Reset timer asynchronously (allowed by rule)
    setTimeout(() => {
      setTimeLeft(60);
    }, 0);

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === 11) {
          tickSoundRef.current?.play();
          const taunts = bossRef.current.taunts;
          setDialogue(taunts[Math.floor(Math.random() * taunts.length)]);
        }

        if (prev <= 1) {
          clearInterval(intervalRef.current);
          timeUpSoundRef.current?.play();
          triggerPlayerHit();
          onAnswerRef.current("__timeout__");
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [question, gameStatus, triggerPlayerHit]);

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = () => {
    if (!input.trim()) return;

    const result = onAnswer(input);

    if (result === "boss") triggerBossHit();
    if (result === "player") triggerPlayerHit();

    setInput("");
  };

  /* ---------------- WIN / LOSE DIALOGUE ---------------- */
  const finalDialogue =
    gameStatus === "win"
      ? boss.defeat
      : gameStatus === "lose"
      ? boss.victory
      : dialogue;

  /* ---------------- UI CALCULATIONS ---------------- */
  const playerHealthPercent = (playerHP / 3) * 100;
  const bossHealthPercent = (bossHP / 5) * 100;
  const timerPercent = (timeLeft / 60) * 100;

  return (
    <div className="game-container">
      <div className={`arena ${rumble ? "rumble" : ""}`}>
        {/* PLAYER */}
        <div className={`character ${playerHit ? "shake" : ""}`}>
          <div className="health-container">
            <div
              className="health-bar"
              style={{ width: `${playerHealthPercent}%` }}
            />
          </div>
          <div className="sprite">🧑</div>
        </div>

        {/* CENTER */}
        <div className="question-box">
          <h2>
            {boss.emoji} {boss.name}
          </h2>

          <div className="dialogue-box">{finalDialogue}</div>

          {gameStatus === "playing" && (
            <>
              <div className="timer-number">{timeLeft}s</div>

              <div className="timer-bar">
                <div
                  className={`timer-fill ${
                    timeLeft <= 10 ? "flash" : ""
                  }`}
                  style={{
                    width: `${timerPercent}%`,
                    background:
                      timeLeft <= 10
                        ? "red"
                        : timeLeft <= 20
                        ? "orange"
                        : "limegreen"
                  }}
                />
              </div>

              <h3>{question?.question}</h3>

              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type answer..."
              />

              <button onClick={handleSubmit}>Attack!</button>
            </>
          )}

          {gameStatus === "win" && (
            <>
              <h2>🎉 You Defeated the Boss!</h2>
              <button onClick={onRestart}>Back to Select</button>
            </>
          )}

          {gameStatus === "lose" && (
            <>
              <h2>💀 You Were Defeated!</h2>
              <button onClick={onRestart}>Try Again</button>
            </>
          )}
        </div>

        {/* BOSS */}
        <div className={`character ${bossHit ? "shake" : ""}`}>
          <div className="health-container boss-health">
            <div
              className="health-bar"
              style={{ width: `${bossHealthPercent}%` }}
            />
          </div>
          <div className="sprite">{boss.emoji}</div>
        </div>
      </div>

      <div className="lava" />
    </div>
  );
}
