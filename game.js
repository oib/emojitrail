// Game configuration
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const playerNameInput = document.getElementById('playerName');
const joinBtn = document.getElementById('joinBtn');
const shareBtn = document.getElementById('shareBtn');
const scoreValue = document.getElementById('scoreValue');
const playerCount = document.getElementById('playerCount');
const gameOverModal = document.getElementById('gameOver');
const finalScore = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');

// Game state
let gameStarted = false;
let playerId = null;
let players = new Map();
let emojis = [];
let score = 0;
let keys = {};
let lastUpdateTime = 0;
let trailUpdateInterval = null;

// Player configuration
const PLAYER_SIZE = 30;
const PLAYER_SPEED = 5;
const EMOJI_SIZE = 20;
const TRAIL_LENGTH = 50;
const EMOJI_SPAWN_RATE = 2000; // milliseconds

// Available emojis to collect
const EMOJI_TYPES = ['⭐', '💎', '🍎', '🍕', '🎯', '🎈', '🌟', '💰', '🏆', '🎁'];

// Player class
class Player {
    constructor(id, name, x, y, emoji) {
        this.id = id;
        this.name = name;
        this.x = x;
        this.y = y;
        this.emoji = emoji;
        this.trail = [];
        this.score = 0;
        this.color = this.getRandomColor();
        this.lastTrailUpdate = Date.now();
    }

    getRandomColor() {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    update(deltaTime) {
        // Store previous position for trail
        const prevX = this.x;
        const prevY = this.y;

        // Move player based on keys pressed
        if (keys['ArrowUp'] || keys['w'] || keys['W']) {
            this.y = Math.max(PLAYER_SIZE / 2, this.y - PLAYER_SPEED);
        }
        if (keys['ArrowDown'] || keys['s'] || keys['S']) {
            this.y = Math.min(canvas.height - PLAYER_SIZE / 2, this.y + PLAYER_SPEED);
        }
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
            this.x = Math.max(PLAYER_SIZE / 2, this.x - PLAYER_SPEED);
        }
        if (keys['ArrowRight'] || keys['d'] || keys['D']) {
            this.x = Math.min(canvas.width - PLAYER_SIZE / 2, this.x + PLAYER_SPEED);
        }

        // Update trail if player moved
        const now = Date.now();
        if (now - this.lastTrailUpdate > 50) { // Update trail every 50ms
            if (prevX !== this.x || prevY !== this.y) {
                this.trail.push({ x: prevX, y: prevY, timestamp: now });
                
                // Limit trail length
                if (this.trail.length > TRAIL_LENGTH) {
                    this.trail.shift();
                }
            }
            this.lastTrailUpdate = now;
        }
    }

    draw() {
        // Draw trail
        this.trail.forEach((point, index) => {
            const opacity = (index / this.trail.length) * 0.5;
            const size = PLAYER_SIZE * (0.5 + (index / this.trail.length) * 0.5);
            
            ctx.globalAlpha = opacity;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(point.x, point.y, size / 2, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw player
        ctx.globalAlpha = 1;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, PLAYER_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw emoji
        ctx.font = `${PLAYER_SIZE}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, this.x, this.y);

        // Draw name
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(this.name, this.x, this.y - PLAYER_SIZE);
    }
}

// Emoji class
class Emoji {
    constructor() {
        this.x = Math.random() * (canvas.width - EMOJI_SIZE) + EMOJI_SIZE / 2;
        this.y = Math.random() * (canvas.height - EMOJI_SIZE) + EMOJI_SIZE / 2;
        this.type = EMOJI_TYPES[Math.floor(Math.random() * EMOJI_TYPES.length)];
        this.collected = false;
        this.spawnTime = Date.now();
    }

    draw() {
        if (!this.collected) {
            // Pulsing effect
            const scale = 1 + Math.sin((Date.now() - this.spawnTime) / 200) * 0.1;
            const size = EMOJI_SIZE * scale;
            
            ctx.font = `${size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.type, this.x, this.y);
        }
    }

    checkCollision(player) {
        if (!this.collected) {
            const distance = Math.sqrt(
                Math.pow(player.x - this.x, 2) + 
                Math.pow(player.y - this.y, 2)
            );
            
            if (distance < (PLAYER_SIZE + EMOJI_SIZE) / 2) {
                this.collected = true;
                return true;
            }
        }
        return false;
    }
}

// Initialize game
function init() {
    // Set up event listeners
    document.addEventListener('keydown', (e) => {
        keys[e.key] = true;
        
        // Prevent arrow keys from scrolling the page
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
        }
    });

    document.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });

    joinBtn.addEventListener('click', joinGame);
    shareBtn.addEventListener('click', shareRoom);
    restartBtn.addEventListener('click', restartGame);

    // Start rendering
    requestAnimationFrame(gameLoop);
}

// Join game
function joinGame() {
    const name = playerNameInput.value.trim() || 'Player';
    const playerEmoji = ['😀', '😎', '🤖', '👻', '🦄', '🐉', '🦋', '🐸'][Math.floor(Math.random() * 8)];
    
    playerId = Date.now().toString();
    const player = new Player(
        playerId,
        name,
        canvas.width / 2,
        canvas.height / 2,
        playerEmoji
    );
    
    players.set(playerId, player);
    gameStarted = true;
    
    // Start spawning emojis
    spawnEmojiInterval = setInterval(spawnEmoji, EMOJI_SPAWN_RATE);
    
    // Spawn initial emojis
    for (let i = 0; i < 5; i++) {
        emojis.push(new Emoji());
    }
    
    updatePlayerCount();
}

// Spawn emoji
function spawnEmoji() {
    if (emojis.length < 20) {
        emojis.push(new Emoji());
    }
}

// Game loop
function gameLoop(currentTime) {
    const deltaTime = currentTime - lastUpdateTime;
    lastUpdateTime = currentTime;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameStarted) {
        // Update and draw all players
        players.forEach(player => {
            if (player.id === playerId) {
                player.update(deltaTime);
                
                // Check emoji collisions for local player
                emojis.forEach((emoji, index) => {
                    if (emoji.checkCollision(player)) {
                        score += 10;
                        player.score += 10;
                        scoreValue.textContent = score;
                        
                        // Send emoji collection to multiplayer
                        multiplayer.sendEmojiCollected(index);
                        
                        // Remove collected emoji and spawn new one
                        emojis = emojis.filter(e => !e.collected);
                        setTimeout(spawnEmoji, 500);
                    }
                });
            }
            player.draw();
        });

        // Draw emojis
        emojis.forEach(emoji => emoji.draw());

        // Remove old collected emojis
        emojis = emojis.filter(emoji => !emoji.collected || Date.now() - emoji.spawnTime < 1000);
    }

    requestAnimationFrame(gameLoop);
}

// Update player count
function updatePlayerCount() {
    playerCount.textContent = players.size;
}

// Restart game
function restartGame() {
    gameOverModal.classList.add('hidden');
    score = 0;
    scoreValue.textContent = score;
    emojis = [];
    players.clear();
    gameStarted = false;
    playerId = null;
    playerNameInput.value = '';
    
    if (spawnEmojiInterval) {
        clearInterval(spawnEmojiInterval);
    }
}

// Start the game when page loads
window.addEventListener('load', init);
