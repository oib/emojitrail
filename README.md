# Emoji Trail - Multiplayer Game

A fun multiplayer game where players control emoji characters and collect emojis while leaving colorful trails.

## Features

- 🎮 **Multiplayer Gameplay**: Real-time multiplayer with WebSocket support
- 🌈 **Trail Effects**: Each player leaves a fading trail as they move
- 😊 **Emoji Collection**: Collect various emojis to increase your score
- 🏠 **Room System**: Join or create game rooms with shareable links
- 🤖 **Bot Players**: Simulation mode with bot players when multiplayer is unavailable
- 📱 **Responsive Design**: Works on desktop and mobile devices
- ✨ **Modern UI**: Glassmorphism design with gradient backgrounds

## How to Play

1. Enter your name and click "Join Game"
2. Use arrow keys or WASD to move your character
3. Collect emojis to increase your score
4. Your trail follows you as you move
5. Click "Share Room" to invite other players

## Installation

### Prerequisites

- Python 3.8+
- pip

### Setup

1. Clone the repository:
```bash
git clone https://github.com/oib/emojitrail.git
cd emojitrail
```

2. Create a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install fastapi uvicorn
```

4. Run the server:
```bash
uvicorn main:app --host 0.0.0.0 --port 8004
```

5. Open your browser and navigate to `http://localhost:8004`

## Development

### Project Structure

```
emojitrail/
├── main.py          # FastAPI backend with WebSocket support
├── index.html       # Main game HTML
├── style.css        # Game styling
├── game.js          # Core game logic
├── multiplayer.js   # Multiplayer functionality
├── favicon.svg      # Game favicon
├── static/          # Original emoji memory game
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── emoji.js
└── docs/            # Documentation
```

### Game Routes

- `/` - Multiplayer emoji trail game
- `/game` - Original emoji memory game
- `/ws/{room_id}/{player_id}` - WebSocket endpoint for multiplayer

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
