#!/usr/bin/env python3
# Script Version: 0.5
# Description: EmojiTrail game backend (no Flask) — switch to FastAPI

from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import FileResponse, JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
import random
import os
import json
from typing import List, Dict
import asyncio

app = FastAPI()

# Mount static files directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# EMOJIS for the original game
EMOJIS = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵',
  '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗',
  '🐴', '🫎', '🫏', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🪰', '🪱', '🐢', '🐍', '🦎', '🦂',
  '🦀', '🦞', '🦐', '🦑', '🐙', '🪼', '🐠', '🐟', '🐡', '🦈', '🐬', '🐳', '🐋', '🦭', '🐊', '🐆',
  '🐅', '🐃', '🐂', '🐄', '🐪', '🐫', '🦙', '🦘', '🦬', '🐘', '🦣', '🦏', '🦛', '🐐', '🐏', '🐑',
  '🐎', '🐖', '🐀', '🐁', '🐓', '🦃', '🕊️', '🦢', '🦜', '🦚', '🦩', '🕷️', '🕸️', '🦂'
]

# WebSocket connection manager for multiplayer
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.rooms: Dict[str, List[str]] = {}
        self.player_data: Dict[str, Dict] = {}

    async def connect(self, websocket: WebSocket, player_id: str, room_id: str = "default"):
        await websocket.accept()
        self.active_connections[player_id] = websocket
        
        if room_id not in self.rooms:
            self.rooms[room_id] = []
        self.rooms[room_id].append(player_id)
        
        self.player_data[player_id] = {
            "room": room_id,
            "x": 400,
            "y": 300,
            "trail": [],
            "score": 0
        }

    def disconnect(self, player_id: str):
        if player_id in self.active_connections:
            room_id = self.player_data[player_id]["room"]
            self.active_connections.pop(player_id, None)
            self.player_data.pop(player_id, None)
            
            if room_id in self.rooms and player_id in self.rooms[room_id]:
                self.rooms[room_id].remove(player_id)
                if not self.rooms[room_id]:
                    self.rooms.pop(room_id, None)

    async def send_personal_message(self, message: dict, player_id: str):
        if player_id in self.active_connections:
            await self.active_connections[player_id].send_text(json.dumps(message))

    async def broadcast_to_room(self, message: dict, room_id: str, exclude: str = None):
        if room_id in self.rooms:
            for player_id in self.rooms[room_id]:
                if player_id != exclude and player_id in self.active_connections:
                    await self.active_connections[player_id].send_text(json.dumps(message))

manager = ConnectionManager()

@app.get("/")
def serve_index():
    # Serve the new multiplayer emoji trail game
    return FileResponse("index.html")

@app.get("/game")
def serve_game():
    # Serve the original emoji memory game
    return FileResponse("static/index.html")

@app.post("/generate")
async def generate(request: Request):
    body = await request.json()
    level = body.get("level", 1)
    trail = random.choices(EMOJIS, k=level)

    distractor_count = 12 - len(trail)
    distractors = random.sample([e for e in EMOJIS if e not in trail], distractor_count)
    options = list(set(trail + distractors))
    random.shuffle(options)

    return JSONResponse({"trail": trail, "options": options})

@app.websocket("/ws/{room_id}/{player_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, player_id: str):
    await manager.connect(websocket, player_id, room_id)
    
    # Send current room state to new player
    room_players = []
    if room_id in manager.rooms:
        for pid in manager.rooms[room_id]:
            if pid in manager.player_data:
                room_players.append({
                    "id": pid,
                    "data": manager.player_data[pid]
                })
    
    await manager.send_personal_message({
        "type": "roomState",
        "players": room_players
    }, player_id)
    
    # Notify others of new player
    await manager.broadcast_to_room({
        "type": "playerJoined",
        "playerId": player_id,
        "data": manager.player_data[player_id]
    }, room_id, player_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message["type"] == "playerUpdate":
                # Update player data
                if player_id in manager.player_data:
                    manager.player_data[player_id].update(message["data"])
                
                # Broadcast to other players in room
                await manager.broadcast_to_room({
                    "type": "playerUpdate",
                    "playerId": player_id,
                    "data": message["data"]
                }, room_id, player_id)
                
            elif message["type"] == "emojiCollected":
                # Broadcast emoji collection
                await manager.broadcast_to_room({
                    "type": "emojiCollected",
                    "playerId": player_id,
                    "emojiIndex": message["emojiIndex"]
                }, room_id)
                
    except WebSocketDisconnect:
        manager.disconnect(player_id)
        await manager.broadcast_to_room({
            "type": "playerLeft",
            "playerId": player_id
        }, room_id)

# Serve static files from root directory (catch-all route)
@app.get("/{file_name:path}")
def serve_static_files(file_name: str):
    # Skip if this is an API route
    if file_name in ['game', 'generate']:
        raise HTTPException(status_code=404, detail="Not found")
    
    # Check if the file exists in the root directory
    file_path = os.path.join(os.getcwd(), file_name)
    if os.path.isfile(file_path) and file_name.endswith(('.js', '.css', '.html', '.ico', '.svg')):
        return FileResponse(file_path)
    # If not found, return 404
    raise HTTPException(status_code=404, detail="File not found")

