import React from "react";

export default function BossSelect({ books, onSelect }) {
  return (
    <div className="select-screen">
      <h1 className="game-title">🔥 Battle of the Books 🔥</h1>
      <p>Select a Book Boss to Battle</p>

      <div className="book-grid">
        {books.map((book) => (
          <button
            key={book}
            className="book-button"
            onClick={() => onSelect(book)}
          >
            {book}
          </button>
        ))}
      </div>
    </div>
  );
}
