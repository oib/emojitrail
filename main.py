#!/usr/bin/env python3
# Script Version: 0.5
# Description: EmojiTrail game backend (no Flask) — switch to FastAPI

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import random
import os

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")



@app.get("/")
def serve_index():
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

