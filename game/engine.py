"""Core game logic: board operations, move validation, and win/draw detection."""

from __future__ import annotations

from typing import Optional

from .models import BoardType

# Pre-computed winning combinations: each is a list of (row, col) tuples
WINNING_LINES: list[list[tuple[int, int]]] = [
    # Rows
    [(0, 0), (0, 1), (0, 2)],
    [(1, 0), (1, 1), (1, 2)],
    [(2, 0), (2, 1), (2, 2)],
    # Columns
    [(0, 0), (1, 0), (2, 0)],
    [(0, 1), (1, 1), (2, 1)],
    [(0, 2), (1, 2), (2, 2)],
    # Diagonals
    [(0, 0), (1, 1), (2, 2)],
    [(0, 2), (1, 1), (2, 0)],
]


class GameBoard:
    """
    Encapsulates a Tic Tac Toe board with operations for game play.

    The board is a 3x3 grid where each cell is 'X', 'O', or '' (empty).
    All mutation methods return new board states (immutable style) to
    support AI tree search without side-effect concerns.
    """

    def __init__(self, board: Optional[BoardType] = None) -> None:
        self._board: BoardType = board or [[""] * 3 for _ in range(3)]

    @property
    def board(self) -> BoardType:
        """Return a deep copy of the board state."""
        return [row[:] for row in self._board]

    def get_cell(self, row: int, col: int) -> str:
        """Get the value at a specific cell."""
        return self._board[row][col]

    def is_valid_move(self, row: int, col: int) -> bool:
        """Check if a move is within bounds and the cell is empty."""
        if not (0 <= row <= 2 and 0 <= col <= 2):
            return False
        return self._board[row][col] == ""

    def make_move(self, row: int, col: int, player: str) -> "GameBoard":
        """
        Return a NEW GameBoard with the move applied.

        Does not mutate the current board — safe for recursive AI search.
        """
        if not self.is_valid_move(row, col):
            raise ValueError(f"Invalid move at ({row}, {col}).")
        new_board = self.board  # deep copy via property
        new_board[row][col] = player
        return GameBoard(new_board)

    def make_move_inplace(self, row: int, col: int, player: str) -> None:
        """Apply a move directly to this board (mutating). Use for final game state."""
        if not self.is_valid_move(row, col):
            raise ValueError(f"Invalid move at ({row}, {col}).")
        self._board[row][col] = player

    def get_empty_cells(self) -> list[tuple[int, int]]:
        """Return a list of (row, col) tuples for all empty cells."""
        return [
            (r, c)
            for r in range(3)
            for c in range(3)
            if self._board[r][c] == ""
        ]

    def check_winner(self) -> Optional[str]:
        """
        Check if there's a winner.

        Returns 'X', 'O', or None.
        """
        for line in WINNING_LINES:
            cells = [self._board[r][c] for r, c in line]
            if cells[0] != "" and cells[0] == cells[1] == cells[2]:
                return cells[0]
        return None

    def get_winning_line(self) -> Optional[list[list[int]]]:
        """
        Return the coordinates of the winning line, if any.

        Returns a list of [row, col] pairs, or None.
        """
        for line in WINNING_LINES:
            cells = [self._board[r][c] for r, c in line]
            if cells[0] != "" and cells[0] == cells[1] == cells[2]:
                return [[r, c] for r, c in line]
        return None

    def is_draw(self) -> bool:
        """Check if the game is a draw (no winner and no empty cells)."""
        return self.check_winner() is None and len(self.get_empty_cells()) == 0

    def is_game_over(self) -> bool:
        """Check if the game has ended (either a win or a draw)."""
        return self.check_winner() is not None or self.is_draw()

    def count_moves(self, player: str) -> int:
        """Count how many moves a specific player has made."""
        return sum(
            1 for r in range(3) for c in range(3) if self._board[r][c] == player
        )

    def __repr__(self) -> str:
        rows = []
        for row in self._board:
            rows.append(" | ".join(cell if cell else "." for cell in row))
        return "\n---------\n".join(rows)