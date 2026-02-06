// Multiplayer functionality using WebSocket
class MultiplayerManager {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.roomId = this.getRoomIdFromUrl() || this.generateRoomId();
        this.isHost = false;
    }

    generateRoomId() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    getRoomIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('room');
    }

    async connect(playerId) {
        try {
            // Connect to WebSocket server
            this.socket = new WebSocket(`ws://localhost:8004/ws/${this.roomId}/${playerId}`);
            
            this.socket.onopen = () => {
                console.log('Connected to multiplayer server');
                this.connected = true;
                
                // Update UI to show connected status
                const playerCount = document.getElementById('playerCount');
                if (playerCount) {
                    playerCount.style.color = '#4ECDC4';
                }
            };

            this.socket.onmessage = (event) => {
                const message = JSON.parse(event.data);
                this.handleMessage(message);
            };

            this.socket.onclose = () => {
                console.log('Disconnected from multiplayer server');
                this.connected = false;
                
                // Update UI to show disconnected status
                const playerCount = document.getElementById('playerCount');
                if (playerCount) {
                    playerCount.style.color = '#FF6B6B';
                }
            };

            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                // Fallback to simulation mode
                this.simulateMultiplayer();
            };

        } catch (error) {
            console.error('Failed to connect to WebSocket server:', error);
            // Fallback to simulation mode
            this.simulateMultiplayer();
        }
    }

    handleMessage(message) {
        switch (message.type) {
            case 'roomState':
                // Initialize room with existing players
                message.players.forEach(playerData => {
                    if (playerData.id !== playerId && !players.has(playerData.id)) {
                        const player = new Player(
                            playerData.id,
                            `Player ${playerData.id.substring(0, 5)}`,
                            playerData.data.x,
                            playerData.data.y,
                            '🤖'
                        );
                        player.trail = playerData.data.trail || [];
                        player.score = playerData.data.score || 0;
                        players.set(playerData.id, player);
                    }
                });
                updatePlayerCount();
                break;

            case 'playerJoined':
                // Add new player to the game
                if (message.playerId !== playerId && !players.has(message.playerId)) {
                    const player = new Player(
                        message.playerId,
                        `Player ${message.playerId.substring(0, 5)}`,
                        message.data.x,
                        message.data.y,
                        '🤖'
                    );
                    players.set(message.playerId, player);
                    updatePlayerCount();
                }
                break;

            case 'playerLeft':
                // Remove player from the game
                if (message.playerId !== playerId && players.has(message.playerId)) {
                    players.delete(message.playerId);
                    updatePlayerCount();
                }
                break;

            case 'playerUpdate':
                // Update remote player position
                if (message.playerId !== playerId && players.has(message.playerId)) {
                    const player = players.get(message.playerId);
                    player.x = message.data.x;
                    player.y = message.data.y;
                    player.trail = message.data.trail || [];
                    player.score = message.data.score || 0;
                }
                break;

            case 'emojiCollected':
                // Handle emoji collected by another player
                if (message.playerId !== playerId && emojis[message.emojiIndex]) {
                    emojis[message.emojiIndex].collected = true;
                }
                break;
        }
    }

    sendPlayerUpdate(player) {
        if (this.socket && this.connected) {
            // Send player position to server
            this.socket.send(JSON.stringify({
                type: 'playerUpdate',
                data: {
                    x: player.x,
                    y: player.y,
                    trail: player.trail,
                    score: player.score
                }
            }));
        }
    }

    sendEmojiCollected(emojiIndex) {
        if (this.socket && this.connected) {
            this.socket.send(JSON.stringify({
                type: 'emojiCollected',
                emojiIndex: emojiIndex
            }));
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
        }
    }

    // Fallback simulation mode
    simulateMultiplayer() {
        console.log('Running in simulation mode');
        
        // Add some bot players after a delay
        setTimeout(() => {
            if (gameStarted && players.size < 4) {
                const botNames = ['Bot1', 'Bot2', 'Bot3'];
                const botEmojis = ['🤖', '👾', '🎮'];
                const randomIndex = Math.floor(Math.random() * botNames.length);
                
                const botId = 'bot_' + Date.now();
                const bot = new Player(
                    botId,
                    botNames[randomIndex],
                    Math.random() * canvas.width,
                    Math.random() * canvas.height,
                    botEmojis[randomIndex]
                );
                
                players.set(botId, bot);
                updatePlayerCount();
                
                // Make bot move randomly
                this.animateBot(bot);
            }
        }, 3000);
    }

    animateBot(bot) {
        const moveBot = () => {
            if (!players.has(bot.id)) return;
            
            // Random movement
            const directions = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
            const randomDirection = directions[Math.floor(Math.random() * directions.length)];
            
            // Simulate key press
            const prevKeys = { ...keys };
            keys[randomDirection] = true;
            
            setTimeout(() => {
                keys[randomDirection] = false;
                keys = prevKeys;
            }, 500);
            
            // Continue animating
            if (players.has(bot.id)) {
                setTimeout(moveBot, 1000 + Math.random() * 2000);
            }
        };
        
        moveBot();
    }
}

// Create multiplayer manager instance
const multiplayer = new MultiplayerManager();

// Modify the existing joinGame function to include multiplayer connection
const originalJoinGame = window.joinGame;
window.joinGame = function() {
    originalJoinGame();
    
    // Connect to multiplayer server after player is created
    setTimeout(() => {
        if (playerId) {
            multiplayer.connect(playerId);
        }
    }, 100);
};

// Send player updates periodically
setInterval(() => {
    if (gameStarted && playerId) {
        const player = players.get(playerId);
        if (player) {
            multiplayer.sendPlayerUpdate(player);
        }
    }
}, 100); // Send updates 10 times per second

// Add room sharing functionality
function shareRoom() {
    const url = window.location.origin + '?room=' + multiplayer.roomId;
    
    if (navigator.share) {
        navigator.share({
            title: 'Emoji Trail Game',
            text: 'Join my Emoji Trail game room!',
            url: url
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(url).then(() => {
            alert('Room link copied to clipboard!\n\n' + url);
        });
    }
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    multiplayer.disconnect();
});
