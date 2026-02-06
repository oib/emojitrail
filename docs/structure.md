# EmojiTrail Game Documentation

## Overview
EmojiTrail is a memory game designed for children where players must remember and recreate sequences of emojis. The game increases in difficulty as the player progresses through levels.

## Game Concept
- **Objective**: Remember the sequence of emojis shown and select them in the correct order
- **Progression**: Each level adds one more emoji to the sequence
- **Scoring**: Track your best level achieved (stored locally)

## Technical Architecture

### Backend (FastAPI)
- **File**: `main.py`
- **Framework**: FastAPI (Python web framework)
- **Endpoints**:
  - `GET /`: Serves the main HTML page
  - `POST /generate`: Generates emoji trails and options (currently unused, game runs client-side)

### Frontend Structure

#### HTML (`static/index.html`)
- Semantic HTML5 structure
- Mobile-responsive viewport meta tag
- Accessibility features (aria-labels)
- Modular JavaScript imports

#### JavaScript Modules

1. **`emoji.js`**
   - Contains the master emoji array (90+ kid-friendly emojis)
   - Exports emoji collection for other modules

2. **`app.js`**
   - Core game logic and state management
   - Functions:
     - `startGame()`: Initiates new game rounds
     - `generateTrail(level)`: Creates random emoji sequences
     - `generateOptions(trail)`: Creates 12-option grid with distractors
     - `showTrail()`: Displays the sequence to memorize
     - `showOptions()`: Renders clickable emoji grid
     - `handlePick()`: Processes player selections
   - Local storage integration for best level tracking

3. **`button.js`**
   - Button interaction handlers (if exists)

#### CSS (`static/style.css`)
- CSS variables for theming
- Responsive design with media queries
- Accessibility focus styles
- Smooth transitions and hover effects
- Mobile-optimized layouts

## Game Flow
1. Player clicks start button (🔄)
2. Sequence of emojis displays for 2 seconds
3. Emojis hide, 12-option grid appears
4. Player clicks emojis in correct order
5. Success: Level increases, failure: Retry current level
6. Best level saved to local storage

## Features
- **Kid-friendly emojis**: Animals, insects, and creatures
- **Progressive difficulty**: Starts at 1 emoji, increases by 1 each level
- **Visual feedback**: Hover effects, selection states, success/failure messages
- **Mobile responsive**: Works on phones and tablets
- **Accessibility**: ARIA labels, keyboard navigation support
- **Local persistence**: Best level saved between sessions

## Deployment
- Static files served from `/static` directory
- FastAPI serves the application
- No external dependencies required for basic functionality
- Runs on Python 3.7+

## Future Enhancements
- Sound effects for interactions
- Timer challenges
- Different emoji categories
- Multiplayer support
- Achievement system
