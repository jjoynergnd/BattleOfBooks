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
import { questions } from "../data/questions";

export default function GameScreen({
  selectedBook,
  bossHP,
  playerHP,
  question,
  onAnswer,
  gameStatus,
  onRestart,
  correctCount,
  questionCount,
  onChallengeAnswer
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

  const [playerDialogue, setPlayerDialogue] = useState("");
  const [showPlayerBubble, setShowPlayerBubble] = useState(false);

  const [isPaused, setIsPaused] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  // Animations
  const [projectileActive, setProjectileActive] = useState(false);
  const [bossScale, setBossScale] = useState(1);
  const [bossAttacking, setBossAttacking] = useState(false);

  // Boss Challenge
  const [challengeReady, setChallengeReady] = useState(false);
  const [challengeActive, setChallengeActive] = useState(false);
  const [challengeQuestion, setChallengeQuestion] = useState(null);
  const [challengeInput, setChallengeInput] = useState("");

  /* ---------------- REFS ---------------- */
  const intervalRef = useRef(null);
  const onAnswerRef = useRef(onAnswer);
  const bossRef = useRef(boss);
  const isPausedRef = useRef(false);
  const tickSoundRef = useRef(null);
  const timeUpSoundRef = useRef(null);

  useEffect(() => {
    onAnswerRef.current = onAnswer;
  }, [onAnswer]);

  useEffect(() => {
    bossRef.current = boss;
  }, [boss]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

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

    setProjectileActive(true);
    setTimeout(() => {
      setProjectileActive(false);
    }, 400);

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

    setBossScale((prev) => Math.min(prev + 0.1, 1.6));
    setBossAttacking(true);
    setTimeout(() => {
      setBossAttacking(false);
    }, 400);

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

    setTimeout(() => {
      setTimeLeft(60);
    }, 0);

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (isPausedRef.current || challengeActive) return prev;

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
  }, [question, gameStatus, triggerPlayerHit, challengeActive]);

 /* ---------------- BOSS CHALLENGE TIMER ---------------- */
  useEffect(() => {
    if (gameStatus !== "playing") {
      // React 19 StrictMode-safe reset
      Promise.resolve().then(() => {
        setChallengeReady(false);
        setChallengeActive(false);
      });
      return;
    }

    // If already in a challenge, do not schedule a new one
    if (challengeActive) return;

    // Random delay for Boss Challenge (10–25 seconds)
    const delay = Math.random() * 15000 + 10000;

    const id = setTimeout(() => {
      setChallengeReady(true);
    }, delay);

    return () => clearTimeout(id);
  }, [gameStatus, question, challengeActive]);


  /* ---------------- SUBMIT NORMAL ---------------- */
  const handleSubmit = () => {
    if (!input.trim() || isPaused || gameStatus !== "playing") return;
    if (challengeActive) return;

    const result = onAnswer(input);

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

  /* ---------------- BOSS CHALLENGE ---------------- */
  const startChallenge = () => {
    if (!selectedBook || !questions[selectedBook]) return;
    const pool = questions[selectedBook];
    const q = pool[Math.floor(Math.random() * pool.length)];
    setChallengeQuestion(q);
    setChallengeActive(true);
    setChallengeReady(false);
    setIsPaused(true);
    setChallengeInput("");
    setLastResult(null);
  };

  const declineChallenge = () => {
    const taunts = bossRef.current.taunts || [];
    if (taunts.length > 0) {
      const bossLine =
        taunts[Math.floor(Math.random() * taunts.length)];
      setDialogue(bossLine);
    }
    setChallengeReady(false);
  };

  const handleChallengeSubmit = () => {
    if (!challengeQuestion || !challengeInput.trim()) return;
    if (!onChallengeAnswer) return;

    const normalized = challengeInput.toLowerCase().trim();
    const correctAnswer = challengeQuestion.answer.toLowerCase();
    const isCorrect = normalized === correctAnswer;

    setLastResult({
      correct: isCorrect,
      answer: challengeQuestion.answer
    });

    if (isCorrect) {
      triggerBossHit();
    } else {
      triggerPlayerHit();
    }

    onChallengeAnswer(isCorrect);

    setChallengeActive(false);
    setChallengeQuestion(null);
    setChallengeInput("");
    setIsPaused(false);
  };

  /* ---------------- RESET RESULT ON QUESTION CHANGE ---------------- */
  useEffect(() => {
    const id = setTimeout(() => {
      setLastResult(null);
    }, 1800);
    return () => clearTimeout(id);
  }, [question, challengeQuestion]);

  /* ---------------- PAUSE / BACK ---------------- */
  const handleTogglePause = () => {
    if (gameStatus !== "playing" || challengeActive) return;
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

  const showingChallenge = challengeActive && challengeQuestion;

  return (
    <div className="game-container">
      <div className={`arena ${rumble ? "rumble" : ""}`}>
        {/* PLAYER */}
        <div
          className={`character player-character ${
            playerHit ? "shake" : ""
          }`}
          style={{ position: "relative" }}
        >
          <div className="health-container">
            <div
              className="health-bar"
              style={{ width: `${playerHealthPercent}%` }}
            />
          </div>
          <div className="sprite">
            <img
              src="/player/player.png"
              alt="Player"
              className="player-body"
            />
          </div>
          {projectileActive && (
            <div className="projectile" />
          )}
          {showPlayerBubble && (
            <div className="player-speech-bubble">{playerDialogue}</div>
          )}
        </div>

        {/* QUESTION BOX */}
        <div className="question-box">
          <h2>
            {boss.emoji} {boss.name}
          </h2>

          {isPlaying && !showingChallenge && (
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

              {challengeReady && (
                <div className="challenge-row">
                  <button
                    className="challenge-button"
                    onClick={startChallenge}
                  >
                    ⚡ Boss Challenge!
                  </button>
                  <button
                    className="challenge-decline"
                    onClick={declineChallenge}
                  >
                    Not Now
                  </button>
                </div>
              )}

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

              {lastResult && !showingChallenge && (
                <div
                  className="result-banner"
                  style={{
                    background: lastResult.correct ? "green" : "darkred"
                  }}
                >
                  {lastResult.correct
                    ? `Correct! Answer: ${lastResult.answer}`
                    : `Wrong! Correct Answer: ${lastResult.answer}`}
                </div>
              )}
            </>
          )}

          {/* BOSS CHALLENGE UI */}
          {isPlaying && showingChallenge && (
            <>
              <div className="challenge-title">
                ⚡ Boss Challenge Question ⚡
              </div>
              <p className="challenge-description">
                Get it right: boss loses HALF HP.  
                Get it wrong: you fall instantly!
              </p>
              <h3>{challengeQuestion.question}</h3>
              <input
                value={challengeInput}
                onChange={(e) => setChallengeInput(e.target.value)}
                placeholder="Type your mega answer..."
              />
              <button
                onClick={handleChallengeSubmit}
                disabled={!challengeInput.trim()}
              >
                Answer Challenge!
              </button>

              {lastResult && showingChallenge && (
                <div
                  className="result-banner"
                  style={{
                    background: lastResult.correct ? "green" : "darkred"
                  }}
                >
                  {lastResult.correct
                    ? `Epic! Answer: ${lastResult.answer}`
                    : `Defeated! Correct Answer: ${lastResult.answer}`}
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
          className={`character boss-character ${
            bossHit ? "shake" : ""
          }`}
          style={{ position: "relative" }}
        >
          <div className="speech-bubble">{finalDialogue}</div>
          <div className="health-container boss-health">
            <div
              className="health-bar"
              style={{ width: `${bossHealthPercent}%` }}
            />
          </div>
          <div
            className={`sprite boss-sprite ${
              bossAttacking ? "boss-attack" : ""
            }`}
            style={{ transform: `scale(${bossScale})` }}
          >
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
