// app.js – Central game logic and initialization for EmojiTrail

import { EMOJIS } from './emoji.js';

// Game state variables
let currentTrail = [];
let currentLevel = 1;
let selected = [];
let bestLevel = localStorage.getItem('bestLevel') || 1;

/**
 * Starts a new game round, resetting state and displaying the trail and options.
 */
export function startGame() {
  const levelDisplay = document.getElementById('level');
  const messageDisplay = document.getElementById('message');
  const trailBox = document.getElementById('trail');
  const optionsBox = document.getElementById('options');

  if (!levelDisplay || !messageDisplay || !trailBox || !optionsBox) return;

  messageDisplay.textContent = '';
  const trail = generateTrail(currentLevel);
  currentTrail = trail;
  selected = [];
  levelDisplay.textContent = `Level ${currentLevel} (Best: ${bestLevel})`;

  showTrail(trail);

  setTimeout(() => {
    trailBox.innerHTML = ''; // Clear trail for options display
    showOptions(generateOptions(trail));
  }, 2000);
}

// Initialize start button
const startBtn = document.getElementById('startBtn');
if (startBtn) {
  startBtn.textContent = '🔄';
  startBtn.addEventListener('click', startGame);
}

/**
 * Generates a trail of random emojis based on the current level.
 * @param {number} level - The current game level.
 * @returns {string[]} Array of emojis.
 */
function generateTrail(level) {
  const result = [];
  for (let i = 0; i < level; i++) {
    result.push(EMOJIS[Math.floor(Math.random() * EMOJIS.length)]);
  }
  return result;
}

/**
 * Generates a shuffled array of 12 options, including trail emojis and distractors.
 * @param {string[]} trail - The current trail of emojis.
 * @returns {string[]} Shuffled array of options.
 */
function generateOptions(trail) {
  const trailSet = new Set(trail);
  const needed = 12 - trailSet.size;
  const distractors = EMOJIS.filter(e => !trailSet.has(e));
  const randomExtras = [];
  while (randomExtras.length < needed) {
    const candidate = distractors[Math.floor(Math.random() * distractors.length)];
    if (!randomExtras.includes(candidate)) randomExtras.push(candidate);
  }
  const combined = [...trailSet, ...randomExtras];
  return shuffle(combined);
}

/**
 * Shuffles an array using the Fisher-Yates algorithm.
 * @param {any[]} array - The array to shuffle.
 * @returns {any[]} The shuffled array.
 */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Displays the trail of emojis in the DOM.
 * @param {string[]} trail - The array of emojis to display.
 */
function showTrail(trail) {
  const box = document.getElementById('trail');
  if (!box) return;
  box.innerHTML = ''; // Clear previous trail
  trail.forEach(e => {
    const span = document.createElement('span');
    span.className = 'trail-emoji';
    span.textContent = e;
    box.appendChild(span);
  });
}

/**
 * Displays the grid of clickable emoji options.
 * @param {string[]} options - The array of emojis to display as options.
 */
function showOptions(options) {
  const grid = document.getElementById('options');
  if (!grid) return;
  grid.innerHTML = ''; // Clear previous options
  options.forEach(e => {
    const span = document.createElement('span');
    span.textContent = e;
    span.addEventListener('click', () => handlePick(e, span));
    grid.appendChild(span);
  });
}

/**
 * Handles player selection of an emoji option.
 * @param {string} emoji - The selected emoji.
 * @param {HTMLElement} el - The DOM element clicked.
 */
function handlePick(emoji, el) {
  el.classList.add('picked');
  selected.push(emoji);

  const messageDisplay = document.getElementById('message');
  const levelDisplay = document.getElementById('level');

  if (!messageDisplay || !levelDisplay) return;

  if (selected.length === currentTrail.length) {
    if (selected.every((e, i) => e === currentTrail[i])) {
      messageDisplay.textContent = '✅ Correct! Level up!';
      currentLevel++;
      if (currentLevel > bestLevel) {
        bestLevel = currentLevel;
        localStorage.setItem('bestLevel', bestLevel);
      }
    } else {
      messageDisplay.textContent = '❌ Wrong! Try again.';
    }
    setTimeout(() => {
      startGame();
    }, 1200);
  }
}
