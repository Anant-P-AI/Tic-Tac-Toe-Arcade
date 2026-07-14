"""Pydantic models for API request/response validation and serialization."""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class Difficulty(str, Enum):
    """AI difficulty levels."""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class Player(str, Enum):
    """Player markers."""
    X = "X"
    O = "O"
    EMPTY = ""


# Type alias for a 3x3 board represented as a list of lists
BoardType = list[list[str]]


class MoveRequest(BaseModel):
    """Request body for making a move against the AI."""

    board: BoardType = Field(
        ...,
        description="3x3 board state. Each cell is 'X', 'O', or '' (empty).",
        json_schema_extra={
            "example": [["X", "", ""], ["", "O", ""], ["", "", ""]]
        },
    )
    difficulty: Difficulty = Field(
        default=Difficulty.HARD,
        description="AI difficulty: 'easy', 'medium', or 'hard'.",
    )

    @field_validator("board")
    @classmethod
    def validate_board_dimensions(cls, v: BoardType) -> BoardType:
        """Ensure the board is exactly 3x3 with valid cell values."""
        if len(v) != 3:
            raise ValueError("Board must have exactly 3 rows.")
        for i, row in enumerate(v):
            if len(row) != 3:
                raise ValueError(f"Row {i} must have exactly 3 columns.")
            for j, cell in enumerate(row):
                if cell not in ("X", "O", ""):
                    raise ValueError(
                        f"Invalid cell value '{cell}' at ({i},{j}). "
                        "Must be 'X', 'O', or ''."
                    )
        return v


class MoveResponse(BaseModel):
    """Response body after AI processes a move."""

    board: BoardType = Field(
        ...,
        description="Updated 3x3 board state after the AI's move.",
    )
    ai_move: Optional[list[int]] = Field(
        default=None,
        description="[row, col] of the AI's chosen move, or null if game was already over.",
    )
    winner: Optional[str] = Field(
        default=None,
        description="'X', 'O', or null. Set if someone has won.",
    )
    is_draw: bool = Field(
        default=False,
        description="True if the game ended in a draw.",
    )
    winning_line: Optional[list[list[int]]] = Field(
        default=None,
        description="List of [row, col] pairs forming the winning line, or null.",
    )
    game_over: bool = Field(
        default=False,
        description="True if the game has ended (win or draw).",
    )


class GameState(BaseModel):
    """Full game state snapshot."""

    board: BoardType = Field(
        default_factory=lambda: [["", "", ""], ["", "", ""], ["", "", ""]],
    )
    current_player: str = Field(default="X")
    winner: Optional[str] = Field(default=None)
    is_draw: bool = Field(default=False)
    game_over: bool = Field(default=False)
    winning_line: Optional[list[list[int]]] = Field(default=None)


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = "ok"
    game: str = "Tic Tac Toe"
    version: str = "1.0.0"