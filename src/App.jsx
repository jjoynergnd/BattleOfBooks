// src/App.jsx
import React, { useState, useCallback } from "react";
import BossSelect from "./components/BossSelect";
import GameScreen from "./components/GameScreen";
import { questions } from "./data/questions";
import "./styles/game.css";

function App() {
  const [selectedBook, setSelectedBook] = useState(null);
  const [bossHP, setBossHP] = useState(5);
  const [playerHP, setPlayerHP] = useState(3);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [usedQuestions, setUsedQuestions] = useState([]);
  const [gameStatus, setGameStatus] = useState("select");

  const books = Object.keys(questions);

  const playSound = useCallback((fileName) => {
    const audio = new Audio(`/sounds/${fileName}`);
    audio.volume = 0.6;
    audio.play().catch(() => {});
  }, []);

  const getRandomQuestion = useCallback((book, used) => {
    const available = questions[book].filter(
      (q) => !used.includes(q.question)
    );
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
  }, []);

  const startGame = useCallback(
    (book) => {
      playSound("loading.mp3");
      setSelectedBook(book);
      setBossHP(5);
      setPlayerHP(3);
      setUsedQuestions([]);

      const firstQ = getRandomQuestion(book, []);
      setCurrentQuestion(firstQ);

      setGameStatus("playing");
    },
    [getRandomQuestion, playSound]
  );

  const handleAnswer = useCallback(
    (input) => {
      if (!currentQuestion || gameStatus !== "playing") return null;

      // TIMEOUT
      if (input === "__timeout__") {
        const newHP = playerHP - 1;
        setPlayerHP(newHP);
        playSound("hurt.mp3");

        if (newHP <= 0) {
          playSound("lost.mp3");
          setGameStatus("lose");
        }
        return "player";
      }

      const normalized = input.toLowerCase().trim();
      const correctAnswer = currentQuestion.answer.toLowerCase();

      let result = null;

      // CORRECT
      if (normalized === correctAnswer) {
        const newBossHP = bossHP - 1;
        setBossHP(newBossHP);
        playSound("hit.mp3");
        result = "boss";

        if (newBossHP <= 0) {
          playSound("win.mp3");
          setGameStatus("win");
        }
      } else {
        // WRONG
        const newHP = playerHP - 1;
        setPlayerHP(newHP);
        playSound("hurt.mp3");
        result = "player";

        if (newHP <= 0) {
          playSound("lost.mp3");
          setGameStatus("lose");
        }
      }

      // Mark question used
      const updatedUsed = [...usedQuestions, currentQuestion.question];
      setUsedQuestions(updatedUsed);

      // Load next question if still alive
      if (
        (result === "boss" && bossHP - 1 > 0) ||
        (result === "player" && playerHP - 1 > 0)
      ) {
        const nextQ = getRandomQuestion(selectedBook, updatedUsed);
        setCurrentQuestion(nextQ);
      }

      return result;
    },
    [
      bossHP,
      playerHP,
      currentQuestion,
      gameStatus,
      usedQuestions,
      selectedBook,
      getRandomQuestion,
      playSound
    ]
  );

  const restart = useCallback(() => {
    // Reset everything for a clean return to select screen
    setGameStatus("select");
    setSelectedBook(null);
    setCurrentQuestion(null);
    setUsedQuestions([]);
  }, []);

  return (
    <>
      {gameStatus === "select" && (
        <BossSelect books={books} onSelect={startGame} />
      )}

      {gameStatus !== "select" && (
        <GameScreen
          selectedBook={selectedBook}
          bossHP={bossHP}
          playerHP={playerHP}
          question={currentQuestion}
          onAnswer={handleAnswer}
          gameStatus={gameStatus}
          onRestart={restart}
        />
      )}
    </>
  );
}

export default App;
