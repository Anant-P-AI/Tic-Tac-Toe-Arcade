"""AI opponent using Minimax with alpha-beta pruning and difficulty scaling."""

from __future__ import annotations

import math
import random
from typing import Optional

from .engine import GameBoard
from .models import Difficulty


class TicTacToeAI:
    """
    AI engine for Tic Tac Toe.

    Uses the Minimax algorithm with alpha-beta pruning for optimal play.
    Difficulty levels control the probability of the AI making the optimal move
    vs. a random move:
        - EASY:   20% optimal, 80% random
        - MEDIUM: 60% optimal, 40% random
        - HARD:   100% optimal (unbeatable)
    """

    OPTIMAL_PROBABILITY: dict[Difficulty, float] = {
        Difficulty.EASY: 0.2,
        Difficulty.MEDIUM: 0.6,
        Difficulty.HARD: 1.0,
    }

    AI_PLAYER = "O"
    HUMAN_PLAYER = "X"

    def __init__(self, difficulty: Difficulty = Difficulty.HARD) -> None:
        self.difficulty = difficulty

    def get_best_move(self, board: GameBoard) -> Optional[tuple[int, int]]:
        empty_cells = board.get_empty_cells()
        if not empty_cells:
            return None

        optimal_chance = self.OPTIMAL_PROBABILITY[self.difficulty]
        if random.random() > optimal_chance:
            return self._get_random_move(empty_cells)

        return self._get_optimal_move(board, empty_cells)

    def _get_random_move(self, empty_cells: list[tuple[int, int]]) -> tuple[int, int]:
        return random.choice(empty_cells)

    def _get_optimal_move(self, board: GameBoard, empty_cells: list[tuple[int, int]]) -> tuple[int, int]:
        if len(empty_cells) == 9:
            return random.choice([(0, 0), (0, 2), (2, 0), (2, 2)])

        best_score = -math.inf
        best_move: tuple[int, int] = empty_cells[0]

        for row, col in empty_cells:
            new_board = board.make_move(row, col, self.AI_PLAYER)
            score = self._minimax(new_board, depth=0, is_maximizing=False, alpha=-math.inf, beta=math.inf)
            if score > best_score:
                best_score = score
                best_move = (row, col)

        return best_move

    def _minimax(self, board: GameBoard, depth: int, is_maximizing: bool, alpha: float, beta: float) -> float:
        winner = board.check_winner()

        if winner == self.AI_PLAYER:
            return 10 - depth
        if winner == self.HUMAN_PLAYER:
            return -10 + depth
        if board.is_draw():
            return 0

        empty_cells = board.get_empty_cells()

        if is_maximizing:
            max_score = -math.inf
            for row, col in empty_cells:
                new_board = board.make_move(row, col, self.AI_PLAYER)
                score = self._minimax(new_board, depth + 1, False, alpha, beta)
                max_score = max(max_score, score)
                alpha = max(alpha, score)
                if beta <= alpha:
                    break
            return max_score
        else:
            min_score = math.inf
            for row, col in empty_cells:
                new_board = board.make_move(row, col, self.HUMAN_PLAYER)
                score = self._minimax(new_board, depth + 1, True, alpha, beta)
                min_score = min(min_score, score)
                beta = min(beta, score)
                if beta <= alpha:
                    break
            return min_score