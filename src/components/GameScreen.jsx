import React, { useState, useEffect } from "react";

export default function GameScreen({
  selectedBook,
  bossHP,
  playerHP,
  question,
  onAnswer,
  gameStatus,
  onRestart
}) {
  const [input, setInput] = useState("");
  const [bossHit, setBossHit] = useState(false);
  const [playerHit, setPlayerHit] = useState(false);
  const [rumble, setRumble] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  // Intro auto-hide
  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const triggerRumble = () => {
    setRumble(true);
    setTimeout(() => setRumble(false), 300);
  };

  const triggerHit = (type) => {
    if (type === "boss") {
      setBossHit(true);
      setTimeout(() => setBossHit(false), 300);
    }

    if (type === "player") {
      setPlayerHit(true);
      setTimeout(() => setPlayerHit(false), 300);
    }

    triggerRumble();
  };

  const handleSubmit = () => {
    if (!input.trim()) return;

    const result = onAnswer(input);

    if (result) {
      triggerHit(result);
    }

    setInput("");
  };

  const playerHealthPercent = (playerHP / 3) * 100;
  const bossHealthPercent = (bossHP / 5) * 100;

  const introQuotes = {
    "The Lightning Thief (Percy Jackson & the Olympians)":
      "⚡ You dare challenge the gods, half-blood?",
    default: "Prepare for battle!"
  };

  return (
    <div className="game-container">
      <div className={`arena ${rumble ? "rumble" : ""}`}>

        {/* Player */}
        <div
          className={`character ${playerHit ? "shake" : ""} ${
            gameStatus === "lose" ? "fall" : ""
          }`}
        >
          <div className="health-container">
            <div
              className="health-bar"
              style={{ width: `${playerHealthPercent}%` }}
            />
          </div>
          <div className="sprite">🧑</div>
        </div>

        {/* Center */}
        <div className="question-box">
          {showIntro && gameStatus === "playing" && (
            <h3 className="boss-intro">
              {introQuotes[selectedBook] || introQuotes.default}
            </h3>
          )}

          {!showIntro && gameStatus === "playing" && (
            <>
              <h3>{selectedBook}</h3>
              <h2>{question?.question}</h2>
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

        {/* Boss */}
        <div
          className={`character ${bossHit ? "shake" : ""} ${
            gameStatus === "win" ? "fall" : ""
          }`}
        >
          <div className="health-container boss-health">
            <div
              className="health-bar"
              style={{ width: `${bossHealthPercent}%` }}
            />
          </div>
          <div className="sprite">👹</div>
        </div>
      </div>

      <div className="lava" />
    </div>
  );
}
