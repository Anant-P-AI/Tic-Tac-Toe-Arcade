/**
 * Tic Tac Toe — Frontend Game Controller
 *
 * Manages game state, AI communication, UI updates,
 * synthesized sound effects, and confetti animations.
 */

// ================================================================
// SOUND MANAGER — Web Audio API synthesized effects (no files needed)
// ================================================================

class SoundManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    _ensureContext() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    _playTone(freq, duration, type = 'sine', volume = 0.15) {
        if (!this.enabled) return;
        try {
            this._ensureContext();
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(volume, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            // Silently ignore audio errors
        }
    }

    playPlace() {
        this._playTone(600, 0.1, 'sine', 0.12);
    }

    playWin() {
        // Ascending arpeggio
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            setTimeout(() => this._playTone(freq, 0.25, 'sine', 0.12), i * 100);
        });
    }

    playLose() {
        // Descending tones
        const notes = [400, 350, 300, 200];
        notes.forEach((freq, i) => {
            setTimeout(() => this._playTone(freq, 0.3, 'triangle', 0.1), i * 120);
        });
    }

    playDraw() {
        this._playTone(440, 0.3, 'triangle', 0.1);
        setTimeout(() => this._playTone(440, 0.3, 'triangle', 0.1), 200);
    }
}


// ================================================================
// CONFETTI ENGINE
// ================================================================

class ConfettiEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.animationId = null;
        this._resize();
        window.addEventListener('resize', () => this._resize());
    }

    _resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    launch(count = 100) {
        this.particles = [];
        const colors = ['#4dfff0', '#ff4da6', '#ffd23f', '#8b5cf6', '#39ff14', '#ff6ec7'];

        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: -10 - Math.random() * 40,
                w: 6 + Math.random() * 6,
                h: 4 + Math.random() * 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                vx: (Math.random() - 0.5) * 6,
                vy: 2 + Math.random() * 4,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 12,
                opacity: 1,
            });
        }

        if (this.animationId) cancelAnimationFrame(this.animationId);
        this._animate();
    }

    _animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        let alive = false;

        for (const p of this.particles) {
            if (p.opacity <= 0) continue;
            alive = true;

            p.x += p.vx;
            p.vy += 0.12; // gravity
            p.y += p.vy;
            p.rotation += p.rotationSpeed;
            p.opacity -= 0.005;

            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate((p.rotation * Math.PI) / 180);
            this.ctx.globalAlpha = Math.max(0, p.opacity);
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            this.ctx.restore();
        }

        if (alive) {
            this.animationId = requestAnimationFrame(() => this._animate());
        } else {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.animationId = null;
        }
    }
}


// ================================================================
// GAME CONTROLLER
// ================================================================

class GameController {
    constructor() {
        // State
        this.board = Array.from({ length: 3 }, () => Array(3).fill(''));
        this.currentPlayer = 'X';
        this.gameOver = false;
        this.mode = 'ai';          // 'ai' or 'pvp'
        this.difficulty = 'hard';  // 'easy', 'medium', 'hard'
        this.isAIThinking = false;
        this.scores = this._loadScores();

        // Managers
        this.sound = new SoundManager();
        this.confetti = new ConfettiEngine('confetti-canvas');

        // DOM
        this.cells = document.querySelectorAll('.cell');
        this.turnMarker = document.getElementById('turn-marker');
        this.turnText = document.getElementById('turn-text');
        this.statusBar = document.querySelector('.status-bar');
        this.winLineSVG = document.getElementById('win-line-svg');
        this.winLine = document.getElementById('win-line');
        this.scoreElements = {
            x: document.getElementById('score-x'),
            o: document.getElementById('score-o'),
            draw: document.getElementById('score-draw'),
        };

        this._bindEvents();
        this._updateScoreDisplay();
        this._updateTurnIndicator();
    }

    // ---- Event Binding ----

    _bindEvents() {
        // Board clicks via event delegation
        document.getElementById('game-board').addEventListener('click', (e) => {
            const cell = e.target.closest('.cell');
            if (!cell) return;
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            this._handleCellClick(row, col);
        });

        // Mode toggle
        document.getElementById('mode-toggle').addEventListener('click', (e) => {
            const btn = e.target.closest('.toggle-btn');
            if (!btn) return;
            this._setMode(btn.dataset.mode);
        });

        // Difficulty toggle
        document.getElementById('difficulty-toggle').addEventListener('click', (e) => {
            const btn = e.target.closest('.toggle-btn');
            if (!btn) return;
            this._setDifficulty(btn.dataset.difficulty);
        });

        // Action buttons
        document.getElementById('btn-new-game').addEventListener('click', () => this.resetGame());
        document.getElementById('btn-reset-scores').addEventListener('click', () => this._resetScores());
    }

    // ---- Mode & Difficulty ----

    _setMode(mode) {
        this.mode = mode;

        // Update toggle UI
        document.querySelectorAll('#mode-toggle .toggle-btn').forEach((btn) => {
            const isActive = btn.dataset.mode === mode;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-checked', isActive);
        });

        // Show/hide difficulty selector
        const diffGroup = document.getElementById('difficulty-group');
        if (mode === 'pvp') {
            diffGroup.classList.add('hidden');
        } else {
            diffGroup.classList.remove('hidden');
        }

        // Update score labels
        const scoreLabels = document.querySelectorAll('.score-label');
        if (mode === 'pvp') {
            scoreLabels[0].textContent = 'X';
            scoreLabels[2].textContent = 'O';
        } else {
            scoreLabels[0].textContent = 'X (You)';
            scoreLabels[2].textContent = 'O (AI)';
        }

        this.resetGame();
    }

    _setDifficulty(difficulty) {
        this.difficulty = difficulty;

        document.querySelectorAll('#difficulty-toggle .toggle-btn').forEach((btn) => {
            const isActive = btn.dataset.difficulty === difficulty;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-checked', isActive);
        });

        this.resetGame();
    }

    // ---- Game Logic ----

    async _handleCellClick(row, col) {
        // Guard: ignore invalid clicks
        if (this.gameOver || this.isAIThinking) return;
        if (this.board[row][col] !== '') return;

        // Place the move
        this._placeMove(row, col, this.currentPlayer);
        this.sound.playPlace();

        if (this.mode === 'ai') {
            // Check if player's move ended the game
            const playerWon = this._checkLocalWinner();
            if (playerWon || this._isBoardFull()) {
                this._endGame(playerWon, playerWon ? this._getLocalWinningLine() : null);
                return;
            }

            // AI's turn
            this.currentPlayer = 'O';
            this._updateTurnIndicator();
            this._setThinking(true);

            try {
                const response = await this._requestAIMove();
                this._setThinking(false);

                if (response.ai_move) {
                    const [aiRow, aiCol] = response.ai_move;
                    this.board[aiRow][aiCol] = 'O';
                    this._renderCell(aiRow, aiCol, 'O');
                    this.sound.playPlace();
                }

                if (response.game_over) {
                    this._endGame(response.winner, response.winning_line);
                } else {
                    this.currentPlayer = 'X';
                    this._updateTurnIndicator();
                }
            } catch (err) {
                this._setThinking(false);
                console.error('AI request failed:', err);
                // Fallback: let player continue
                this.currentPlayer = 'X';
                this._updateTurnIndicator();
            }
        } else {
            // PvP mode
            const winner = this._checkLocalWinner();
            if (winner || this._isBoardFull()) {
                this._endGame(winner, winner ? this._getLocalWinningLine() : null);
                return;
            }
            this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
            this._updateTurnIndicator();
        }
    }

    _placeMove(row, col, player) {
        this.board[row][col] = player;
        this._renderCell(row, col, player);
    }

    _renderCell(row, col, player) {
        const cell = document.getElementById(`cell-${row}-${col}`);
        cell.textContent = player;
        cell.classList.add('occupied', player.toLowerCase());
    }

    // ---- Local win/draw detection (for PvP and pre-AI-call checks) ----

    _checkLocalWinner() {
        const lines = [
            [[0,0],[0,1],[0,2]], [[1,0],[1,1],[1,2]], [[2,0],[2,1],[2,2]],
            [[0,0],[1,0],[2,0]], [[0,1],[1,1],[2,1]], [[0,2],[1,2],[2,2]],
            [[0,0],[1,1],[2,2]], [[0,2],[1,1],[2,0]],
        ];
        for (const line of lines) {
            const [a, b, c] = line;
            const va = this.board[a[0]][a[1]];
            if (va && va === this.board[b[0]][b[1]] && va === this.board[c[0]][c[1]]) {
                return va;
            }
        }
        return null;
    }

    _getLocalWinningLine() {
        const lines = [
            [[0,0],[0,1],[0,2]], [[1,0],[1,1],[1,2]], [[2,0],[2,1],[2,2]],
            [[0,0],[1,0],[2,0]], [[0,1],[1,1],[2,1]], [[0,2],[1,2],[2,2]],
            [[0,0],[1,1],[2,2]], [[0,2],[1,1],[2,0]],
        ];
        for (const line of lines) {
            const [a, b, c] = line;
            const va = this.board[a[0]][a[1]];
            if (va && va === this.board[b[0]][b[1]] && va === this.board[c[0]][c[1]]) {
                return line;
            }
        }
        return null;
    }

    _isBoardFull() {
        return this.board.every(row => row.every(cell => cell !== ''));
    }

    // ---- API Communication ----

    async _requestAIMove() {
        const response = await fetch('/api/move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                board: this.board,
                difficulty: this.difficulty,
            }),
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        return response.json();
    }

    // ---- Game End ----

    _endGame(winner, winningLine) {
        this.gameOver = true;

        // Disable all cells
        this.cells.forEach(cell => cell.classList.add('disabled'));

        if (winner) {
            // Highlight winning cells
            if (winningLine) {
                winningLine.forEach(([r, c]) => {
                    document.getElementById(`cell-${r}-${c}`).classList.add('winning-cell');
                });
                this._drawWinLine(winningLine);
            }

            // Update status
            this.turnMarker.textContent = winner;
            this.turnMarker.className = `turn-marker ${winner.toLowerCase()}`;
            this.turnText.textContent = this.mode === 'ai'
                ? (winner === 'X' ? 'You win!' : 'AI wins!')
                : `${winner} wins!`;

            this.statusBar.className = `status-bar glass-card winner-${winner.toLowerCase()}`;

            // Update scores
            this.scores[winner.toLowerCase()]++;
            this._saveScores();
            this._updateScoreDisplay();
            this._bumpScore(winner.toLowerCase());

            // Sound + confetti
            if (winner === 'X' || this.mode === 'pvp') {
                this.sound.playWin();
                this.confetti.launch(120);
            } else {
                this.sound.playLose();
            }
        } else {
            // Draw
            this.turnMarker.textContent = '=';
            this.turnMarker.className = 'turn-marker';
            this.turnText.textContent = "It's a draw!";
            this.statusBar.className = 'status-bar glass-card draw';

            this.scores.draw++;
            this._saveScores();
            this._updateScoreDisplay();
            this._bumpScore('draw');
            this.sound.playDraw();
        }
    }

    // ---- Win Line Animation ----

    _drawWinLine(line) {
        if (!line || line.length < 3) return;

        const boardEl = document.getElementById('game-board');
        const boardRect = boardEl.getBoundingClientRect();

        // Calculate cell centers as percentage of board
        const getCellCenter = (row, col) => {
            const cell = document.getElementById(`cell-${row}-${col}`);
            const cellRect = cell.getBoundingClientRect();
            return {
                x: ((cellRect.left + cellRect.width / 2 - boardRect.left) / boardRect.width) * 300,
                y: ((cellRect.top + cellRect.height / 2 - boardRect.top) / boardRect.height) * 300,
            };
        };

        const start = getCellCenter(line[0][0], line[0][1]);
        const end = getCellCenter(line[2][0], line[2][1]);

        this.winLine.setAttribute('x1', start.x);
        this.winLine.setAttribute('y1', start.y);
        this.winLine.setAttribute('x2', end.x);
        this.winLine.setAttribute('y2', end.y);

        // Trigger animation
        requestAnimationFrame(() => {
            this.winLine.classList.add('animate');
        });
    }

    // ---- UI Updates ----

    _updateTurnIndicator() {
        this.turnMarker.textContent = this.currentPlayer;
        this.turnMarker.className = `turn-marker ${this.currentPlayer.toLowerCase()}`;

        if (this.mode === 'ai') {
            this.turnText.textContent = this.currentPlayer === 'X' ? 'Your turn' : "AI's turn";
        } else {
            this.turnText.textContent = `${this.currentPlayer}'s turn`;
        }

        this.statusBar.className = 'status-bar glass-card';
    }

    _setThinking(thinking) {
        this.isAIThinking = thinking;
        if (thinking) {
            this.statusBar.classList.add('thinking');
            this.cells.forEach(cell => cell.classList.add('disabled'));
        } else {
            this.statusBar.classList.remove('thinking');
            this.cells.forEach(cell => {
                if (!this.gameOver) cell.classList.remove('disabled');
            });
        }
    }

    _updateScoreDisplay() {
        this.scoreElements.x.textContent = this.scores.x;
        this.scoreElements.o.textContent = this.scores.o;
        this.scoreElements.draw.textContent = this.scores.draw;
    }

    _bumpScore(key) {
        const map = { x: '.score-x', o: '.score-o', draw: '.score-draw' };
        const el = document.querySelector(map[key]);
        if (el) {
            el.classList.remove('score-bump');
            void el.offsetWidth; // force reflow
            el.classList.add('score-bump');
        }
    }

    // ---- Score Persistence ----

    _loadScores() {
        try {
            const saved = localStorage.getItem('ttt_scores');
            if (saved) return JSON.parse(saved);
        } catch (e) { /* ignore */ }
        return { x: 0, o: 0, draw: 0 };
    }

    _saveScores() {
        try {
            localStorage.setItem('ttt_scores', JSON.stringify(this.scores));
        } catch (e) { /* ignore */ }
    }

    _resetScores() {
        this.scores = { x: 0, o: 0, draw: 0 };
        this._saveScores();
        this._updateScoreDisplay();
    }

    // ---- Game Reset ----

    resetGame() {
        this.board = Array.from({ length: 3 }, () => Array(3).fill(''));
        this.currentPlayer = 'X';
        this.gameOver = false;
        this.isAIThinking = false;

        // Clear cells
        this.cells.forEach(cell => {
            cell.textContent = '';
            cell.className = 'cell';
        });

        // Clear win line
        this.winLine.classList.remove('animate');
        this.winLine.setAttribute('x1', 0);
        this.winLine.setAttribute('y1', 0);
        this.winLine.setAttribute('x2', 0);
        this.winLine.setAttribute('y2', 0);

        // Reset status
        this._updateTurnIndicator();
        this.statusBar.classList.remove('thinking');
    }
}


// ================================================================
// BOOT
// ================================================================

document.addEventListener('DOMContentLoaded', () => {
    window.game = new GameController();
});
