// button.js – Buttonverhalten für New Game (🔄)

import { startGame } from './app.js';

const startBtn = document.getElementById('startBtn');

if (startBtn) {
  startBtn.addEventListener('click', () => {
    localStorage.removeItem('bestLevel');
    localStorage.removeItem('currentLevel');
    startGame();
  });
}

