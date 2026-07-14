from __future__ import annotations
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from game.ai import TicTacToeAI
from game.engine import GameBoard
from game.models import GameState, HealthResponse, MoveRequest, MoveResponse

BASE_DIR = Path(__file__).resolve().parent

app = FastAPI(
    title="Tic Tac Toe",
    description="A production-ready Tic Tac Toe game with an unbeatable AI.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")
templates = Jinja2Templates(directory=BASE_DIR / "templates")


@app.get("/", response_class=HTMLResponse, include_in_schema=False)
async def serve_game(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(request, "index.html")


@app.post("/api/move", response_model=MoveResponse, tags=["Game"])
async def make_move(payload: MoveRequest) -> MoveResponse:
    board = GameBoard(payload.board)

    winner = board.check_winner()
    if winner or board.is_draw():
        return MoveResponse(
            board=board.board, ai_move=None, winner=winner,
            is_draw=board.is_draw(), winning_line=board.get_winning_line(), game_over=True,
        )

    ai = TicTacToeAI(difficulty=payload.difficulty)
    move = ai.get_best_move(board)

    if move is None:
        return MoveResponse(
            board=board.board, ai_move=None, winner=None,
            is_draw=True, winning_line=None, game_over=True,
        )

    row, col = move
    board.make_move_inplace(row, col, TicTacToeAI.AI_PLAYER)

    return MoveResponse(
        board=board.board, ai_move=[row, col], winner=board.check_winner(),
        is_draw=board.is_draw(), winning_line=board.get_winning_line(), game_over=board.is_game_over(),
    )


@app.post("/api/reset", response_model=GameState, tags=["Game"])
async def reset_game() -> GameState:
    return GameState()


@app.get("/api/health", response_model=HealthResponse, tags=["System"])
async def health_check() -> HealthResponse:
    return HealthResponse()