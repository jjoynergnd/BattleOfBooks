// src/components/GameScreen.jsx
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
  onRestart,
  correctCount,
  questionCount
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

  // Player bubble
  const [playerDialogue, setPlayerDialogue] = useState("");
  const [showPlayerBubble, setShowPlayerBubble] = useState(false);

  // Pause
  const [isPaused, setIsPaused] = useState(false);

  // Show correct answer feedback
  const [lastResult, setLastResult] = useState(null);

  /* ---------------- REFS ---------------- */
  const intervalRef = useRef(null);
  const onAnswerRef = useRef(onAnswer);
  const bossRef = useRef(boss);
  const isPausedRef = useRef(false);
  const tickSoundRef = useRef(null);
  const timeUpSoundRef = useRef(null);

  /* Keep refs updated */
  useEffect(() => {
    onAnswerRef.current = onAnswer;
  }, [onAnswer]);

  useEffect(() => {
    bossRef.current = boss;
  }, [boss]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

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
    setRumble(true);

    const line =
      playerLines.correct[
        Math.floor(Math.random() * playerLines.correct.length)
      ];
    setPlayerDialogue(line);
    setShowPlayerBubble(true);

    const hitLines = bossRef.current.hitLines || [];
    if (hitLines.length > 0) {
      const bossLine =
        hitLines[Math.floor(Math.random() * hitLines.length)];
      setDialogue(bossLine);
    }

    setTimeout(() => {
      setBossHit(false);
      setRumble(false);
    }, 300);

    setTimeout(() => {
      setShowPlayerBubble(false);
    }, 1200);
  }, []);

  const triggerPlayerHit = useCallback(() => {
    setPlayerHit(true);
    setRumble(true);

    const line =
      playerLines.wrong[
        Math.floor(Math.random() * playerLines.wrong.length)
      ];
    setPlayerDialogue(line);
    setShowPlayerBubble(true);

    const taunts = bossRef.current.taunts || [];
    if (taunts.length > 0) {
      const bossLine =
        taunts[Math.floor(Math.random() * taunts.length)];
      setDialogue(bossLine);
    }

    setTimeout(() => {
      setPlayerHit(false);
      setRumble(false);
    }, 300);

    setTimeout(() => {
      setShowPlayerBubble(false);
    }, 1200);
  }, []);

  /* ---------------- TIMER EFFECT ---------------- */
  useEffect(() => {
    if (gameStatus !== "playing") {
      clearInterval(intervalRef.current);
      return;
    }

    clearInterval(intervalRef.current);

    // Reset timer safely
    setTimeout(() => {
      setTimeLeft(60);
    }, 0);

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (isPausedRef.current) return prev;

        if (prev === 11) {
          tickSoundRef.current?.play();
          const taunts = bossRef.current.taunts || [];
          if (taunts.length > 0) {
            const t = taunts[Math.floor(Math.random() * taunts.length)];
            setDialogue(t);
          }
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
    if (!input.trim() || isPaused || gameStatus !== "playing") return;

    const result = onAnswer(input);

    // Show correct answer feedback
    if (result === "boss") {
      setLastResult({
        correct: true,
        answer: question.answer
      });
      triggerBossHit();
    } else if (result === "player") {
      setLastResult({
        correct: false,
        answer: question.answer
      });
      triggerPlayerHit();
    }

    setInput("");
  };

  /* Reset result box when question changes */
  useEffect(() => {
    const id = setTimeout(() => {
      setLastResult(null);
    }, 1800);
    return () => clearTimeout(id);
  }, [question]);

  /* ---------------- PAUSE / BACK ---------------- */
  const handleTogglePause = () => {
    if (gameStatus !== "playing") return;
    setIsPaused((p) => !p);
  };

  const handleBackToBooks = () => {
    clearInterval(intervalRef.current);
    setIsPaused(false);
    onRestart();
  };

  /* ---------------- FINAL DIALOGUE ---------------- */
  const finalDialogue =
    gameStatus === "win"
      ? boss.defeat
      : gameStatus === "lose"
      ? boss.victory
      : dialogue;

  /* ---------------- UI CALCULATIONS ---------------- */
  const playerHealthPercent = (playerHP / 3) * 100;
  const bossHealthPercent = (bossHP / 8) * 100;
  const timerPercent = (timeLeft / 60) * 100;
  const isPlaying = gameStatus === "playing";

  const hasQuestions = questionCount > 0;
  const scorePercent = hasQuestions
    ? Math.round((correctCount / questionCount) * 100)
    : 0;

  return (
    <div className="game-container">
      <div className={`arena ${rumble ? "rumble" : ""}`}>
        {/* PLAYER */}
        <div
          className={`character ${playerHit ? "shake" : ""}`}
          style={{ position: "relative" }}
        >
          <div className="health-container">
            <div
              className="health-bar"
              style={{ width: `${playerHealthPercent}%` }}
            />
          </div>
          <div className="sprite">🧑</div>
          {showPlayerBubble && (
            <div className="player-speech-bubble">{playerDialogue}</div>
          )}
        </div>

        {/* QUESTION BOX */}
        <div className="question-box">
          <h2>
            {boss.emoji} {boss.name}
          </h2>

          {isPlaying && (
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

              <div className="controls-row">
                <button
                  className="pause-button"
                  onClick={handleTogglePause}
                >
                  {isPaused ? "Resume" : "Pause"}
                </button>
                <button
                  className="back-button"
                  onClick={handleBackToBooks}
                >
                  Back to Books
                </button>
              </div>

              <h3>{question?.question}</h3>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type answer..."
                disabled={isPaused}
              />
              <button
                onClick={handleSubmit}
                disabled={isPaused || !input.trim()}
              >
                Attack!
              </button>

              {lastResult && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "10px",
                    borderRadius: "8px",
                    background: lastResult.correct ? "green" : "darkred",
                    border: "2px solid white",
                    color: "white",
                    fontWeight: "bold"
                  }}
                >
                  {lastResult.correct
                    ? `Correct! Answer: ${lastResult.answer}`
                    : `Wrong! Correct Answer: ${lastResult.answer}`}
                </div>
              )}
            </>
          )}

          {/* END-OF-GAME SCORE SUMMARY */}
          {(gameStatus === "win" || gameStatus === "lose") && (
            <div className="score-summary">
              <div className="score-main">
                {hasQuestions
                  ? `${correctCount}/${questionCount} – ${scorePercent}%`
                  : "No questions answered"}
              </div>
              <div className="score-sub">
                {gameStatus === "win"
                  ? "Nice work! You crushed that boss!"
                  : "Tough battle! Want to try again?"}
              </div>
            </div>
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
        <div
          className={`character ${bossHit ? "shake" : ""}`}
          style={{ position: "relative" }}
        >
          <div className="speech-bubble">{finalDialogue}</div>
          <div className="health-container boss-health">
            <div
              className="health-bar"
              style={{ width: `${bossHealthPercent}%` }}
            />
          </div>
          <div className="sprite">
            {boss.image ? (
              <img
                src={boss.image}
                alt={boss.name}
                style={{
                  width: "120px",
                  height: "120px",
                  objectFit: "contain",
                  pointerEvents: "none"
                }}
              />
            ) : (
              boss.emoji
            )}
          </div>

        </div>
      </div>

      <div className="lava" />
    </div>
  );
}
