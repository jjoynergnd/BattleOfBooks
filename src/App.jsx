// src/App.jsx
import React, { useState, useCallback } from "react";
import BossSelect from "./components/BossSelect";
import GameScreen from "./components/GameScreen";
import { questions } from "./data/questions";
import "./styles/game.css";

function App() {
  const [selectedBook, setSelectedBook] = useState(null);
  const [bossHP, setBossHP] = useState(8);
  const [playerHP, setPlayerHP] = useState(3);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [usedQuestions, setUsedQuestions] = useState([]);
  const [gameStatus, setGameStatus] = useState("select");

  const [correctCount, setCorrectCount] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);

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
      setBossHP(8);
      setPlayerHP(3);
      setUsedQuestions([]);
      setCorrectCount(0);
      setQuestionCount(0);

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

        setQuestionCount((prev) => prev + 1);

        if (newHP <= 0) {
          playSound("lost.mp3");
          setGameStatus("lose");
        }
        return "player";
      }

      const normalized = input.toLowerCase().trim();
      const correctAnswer = currentQuestion.answer.toLowerCase();

      let result = null;

      if (normalized === correctAnswer) {
        const newBossHP = bossHP - 1;
        setBossHP(newBossHP);
        playSound("hit.mp3");
        result = "boss";

        setCorrectCount((prev) => prev + 1);
        setQuestionCount((prev) => prev + 1);

        if (newBossHP <= 0) {
          playSound("win.mp3");
          setGameStatus("win");
        }
      } else {
        const newHP = playerHP - 1;
        setPlayerHP(newHP);
        playSound("hurt.mp3");
        result = "player";

        setQuestionCount((prev) => prev + 1);

        if (newHP <= 0) {
          playSound("lost.mp3");
          setGameStatus("lose");
        }
      }

      const updatedUsed = [...usedQuestions, currentQuestion.question];
      setUsedQuestions(updatedUsed);

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

  const handleChallengeAnswer = useCallback(
    (isCorrect) => {
      if (gameStatus !== "playing") return;

      if (isCorrect) {
        const damage = Math.ceil(bossHP / 2);
        const newBossHP = bossHP - damage;
        setBossHP(newBossHP);
        playSound("hit.mp3");

        setCorrectCount((prev) => prev + 1);
        setQuestionCount((prev) => prev + 1);

        if (newBossHP <= 0) {
          playSound("win.mp3");
          setGameStatus("win");
        }
      } else {
        setPlayerHP(0);
        setQuestionCount((prev) => prev + 1);
        playSound("lost.mp3");
        setGameStatus("lose");
      }
    },
    [bossHP, gameStatus, playSound]
  );

  const restart = useCallback(() => {
    setGameStatus("select");
    setSelectedBook(null);
    setCurrentQuestion(null);
    setUsedQuestions([]);
    setCorrectCount(0);
    setQuestionCount(0);
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
          correctCount={correctCount}
          questionCount={questionCount}
          onChallengeAnswer={handleChallengeAnswer}
        />
      )}
    </>
  );
}

export default App;
