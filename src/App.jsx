import React, { useState } from "react";
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

  console.log("APP RENDER", {
    selectedBook,
    bossHP,
    playerHP,
    gameStatus,
  });

  const books = Object.keys(questions);

  // 🔊 Safe sound player (uses public folder)
  const playSound = (fileName) => {
    try {
      console.log("Playing sound:", fileName);
      const audio = new Audio(`/sounds/${fileName}`);
      audio.volume = 0.6;
      audio.play().catch((err) =>
        console.warn("Audio play prevented:", err)
      );
    } catch (err) {
      console.warn("Sound error:", err);
    }
  };

  const getRandomQuestion = (book, used) => {
    console.log("Getting question for:", book);

    if (!questions[book]) {
      console.error("No questions found for book:", book);
      return null;
    }

    const available = questions[book].filter(
      (q) => !used.includes(q.question)
    );

    if (available.length === 0) {
      console.warn("No available questions left");
      return null;
    }

    const random =
      available[Math.floor(Math.random() * available.length)];

    console.log("Selected question:", random.question);
    return random;
  };

  const startGame = (book) => {
    console.log("Starting game for:", book);

    setSelectedBook(book);
    setBossHP(5);
    setPlayerHP(3);
    setUsedQuestions([]);

    const firstQ = getRandomQuestion(book, []);
    setCurrentQuestion(firstQ);

    setGameStatus("playing");
  };

  const handleAnswer = (input) => {
    if (!currentQuestion || gameStatus !== "playing") {
      console.warn("Answer ignored — not in playing state");
      return null;
    }

    const normalized = input.toLowerCase().trim();
    const correctAnswer = currentQuestion.answer.toLowerCase();

    console.log("Player answered:", normalized);
    console.log("Correct answer:", correctAnswer);

    let result = null;

    if (normalized === correctAnswer) {
      const newBossHP = bossHP - 1;
      console.log("Correct! Boss HP →", newBossHP);

      setBossHP(newBossHP);
      result = "boss";

      playSound("hit.mp3");

      if (newBossHP <= 0) {
        console.log("Boss defeated!");
        setGameStatus("win");
        playSound("win.mp3");
      }
    } else {
      const newPlayerHP = playerHP - 1;
      console.log("Wrong! Player HP →", newPlayerHP);

      setPlayerHP(newPlayerHP);
      result = "player";

      playSound("hurt.mp3");

      if (newPlayerHP <= 0) {
        console.log("Player defeated!");
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
  };

  const restart = () => {
    console.log("Restarting game");

    setGameStatus("select");
    setSelectedBook(null);
    setCurrentQuestion(null);
    setUsedQuestions([]);
  };

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
