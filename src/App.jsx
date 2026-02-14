// src/App.jsx
import React, { useState, useRef, useCallback } from "react";
import "./styles/game.css";
import BossSelect from "./components/BossSelect";
import GameScreen from "./components/GameScreen";
import { questions } from "./data/questions";

/* ---------------- SHUFFLE HELPER ---------------- */
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function App() {
  const [selectedBook, setSelectedBook] = useState(null);
  const [bossHP, setBossHP] = useState(8);
  const [playerHP, setPlayerHP] = useState(3);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [gameStatus, setGameStatus] = useState("select");

  // NEW: store shuffled questions for this playthrough
  const [shuffledQuestions, setShuffledQuestions] = useState([]);

  /* ---------------- SOUND REFS ---------------- */
  const hitSoundRef = useRef(null);
  const wrongSoundRef = useRef(null);
  const challengeSuccessSoundRef = useRef(null);
  const challengeFailSoundRef = useRef(null);
  const winSoundRef = useRef(null); // NEW

  /* Load sounds once */
  React.useEffect(() => {
    hitSoundRef.current = new Audio("/sounds/hit.mp3");

    // Wrong sound fallback (guaranteed working)
    wrongSoundRef.current = new Audio("/sounds/hit.mp3");

    // Challenge sounds
    challengeSuccessSoundRef.current = new Audio("/sounds/challenge_success.mp3");
    challengeFailSoundRef.current = new Audio("/sounds/boss_challenge_win.mp3");

    // NEW: Player win celebration sound
    winSoundRef.current = new Audio("/sounds/win.mp3");
    winSoundRef.current.volume = 0.7;

    // Volume tuning
    hitSoundRef.current.volume = 0.5;
    wrongSoundRef.current.volume = 0.5;
    challengeSuccessSoundRef.current.volume = 0.6;
    challengeFailSoundRef.current.volume = 0.6;
  }, []);

  /* ---------------- PLAY SOUND ---------------- */
  const playSound = useCallback((type) => {
    if (type === "hit") {
      hitSoundRef.current?.play();
    } else if (type === "wrong") {
      wrongSoundRef.current?.play();
    } else if (type === "challengeSuccess") {
      challengeSuccessSoundRef.current?.play();
    } else if (type === "challengeFail") {
      challengeFailSoundRef.current?.play();
    } else if (type === "playerWin") {
      winSoundRef.current?.play(); // NEW
    }
  }, []);

  /* ---------------- START GAME ---------------- */
  const handleSelect = (book) => {
    setSelectedBook(book);

    // 🔥 Shuffle the book's questions once per playthrough
    const pool = questions[book] || [];
    setShuffledQuestions(shuffle(pool));

    setBossHP(8);
    setPlayerHP(3);
    setQuestionIndex(0);
    setCorrectCount(0);
    setQuestionCount(0);
    setGameStatus("playing");
  };

  /* ---------------- NORMAL ANSWER ---------------- */
  const handleAnswer = (input) => {
    if (!selectedBook) return null;

    const q = shuffledQuestions[questionIndex];
    const normalized = input.toLowerCase().trim();
    const correct = normalized === q.answer.toLowerCase();

    setQuestionCount((c) => c + 1);

    if (correct) {
      playSound("hit");

      setBossHP((hp) => {
        const newHP = hp - 1;

        // 🔥 NEW: Play win celebration sound when boss dies
        if (newHP <= 0) {
          playSound("playerWin");
          setGameStatus("win");
        }

        return newHP;
      });

      setCorrectCount((c) => c + 1);
    } else {
      playSound("wrong");

      setPlayerHP((hp) => {
        const newHP = hp - 1;
        if (newHP <= 0) setGameStatus("lose");
        return newHP;
      });
    }

    // Advance to next question
    setQuestionIndex((i) => i + 1);

    return correct ? "boss" : "player";
  };

  /* ---------------- BOSS CHALLENGE ANSWER ---------------- */
  const handleChallengeAnswer = (isCorrect) => {
    if (isCorrect) {
      playSound("challengeSuccess");

      // Boss loses HALF HP
      setBossHP((hp) => {
        const newHP = hp - 4;

        if (newHP <= 0) {
          playSound("playerWin"); // NEW
          setGameStatus("win");
        }

        return newHP;
      });

      setCorrectCount((c) => c + 1);
    } else {
      playSound("challengeFail");

      // Player instantly loses
      setPlayerHP(0);
      setGameStatus("lose");
    }
  };

  /* ---------------- RESTART ---------------- */
  const handleRestart = () => {
    setSelectedBook(null);
    setBossHP(8);
    setPlayerHP(3);
    setQuestionIndex(0);
    setCorrectCount(0);
    setQuestionCount(0);
    setShuffledQuestions([]);
    setGameStatus("select");
  };

  /* ---------------- CURRENT QUESTION ---------------- */
  const currentQuestion =
    shuffledQuestions.length > 0
      ? shuffledQuestions[questionIndex]
      : null;

  return (
    <div>
      {gameStatus === "select" && (
        <BossSelect books={Object.keys(questions)} onSelect={handleSelect} />
      )}

      {gameStatus !== "select" && (
        <GameScreen
          selectedBook={selectedBook}
          bossHP={bossHP}
          playerHP={playerHP}
          question={currentQuestion}
          onAnswer={handleAnswer}
          gameStatus={gameStatus}
          onRestart={handleRestart}
          correctCount={correctCount}
          questionCount={questionCount}
          onChallengeAnswer={handleChallengeAnswer}
          playSound={playSound}
        />
      )}
    </div>
  );
}
