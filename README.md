# Tic-Tac-Toe-Arcade

A retro, pixel-art / 8-bit arcade-cabinet styled Tic Tac Toe game with an unbeatable AI opponent, built with **FastAPI** on the backend and **Tailwind CSS** on the frontend.

![Python](https://img.shields.io/badge/python-3.10+-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688)

## Features

- 🤖 Play against an AI with three difficulty levels (Easy / Medium / Hard — Hard is unbeatable, powered by minimax)
- 👥 Local 2-player mode
- 🎨 Retro arcade cabinet UI — CRT scanlines, pixel-cut panel corners, glowing neon marks
- 🔊 8-bit synthesized sound effects (Web Audio API, no audio files)
- 🎉 Confetti celebration on a win
- 📊 Persistent scoreboard (saved in the browser)
- ♿ Accessible: keyboard focus states, `aria-live` status updates, reduced-motion support

## Tech Stack

| Layer      | Tech |
|------------|------|
| Backend    | [FastAPI](https://fastapi.tiangolo.com/) + [Jinja2](https://jinja.palletsprojects.com/) |
| Frontend   | HTML + [Tailwind CSS](https://tailwindcss.com/) (via CDN) + vanilla JS |
| AI Engine  | Minimax with alpha-beta pruning (`game/ai.py`) |
| Server     | [Uvicorn](https://www.uvicorn.org/) |

## Project Structure
.
├── app.py                  # FastAPI app & routes
├── requirements.txt        # Python dependencies
├── game/
│   ├── init.py
│   ├── ai.py                # Minimax AI opponent
│   ├── engine.py             # Board state, win/draw detection
│   └── models.py             # Pydantic request/response models
├── static/
│   ├── css/style.css        # Retro pixel-art theme
│   └── js/app.js             # Game controller, sound, confetti
└── templates/
└── index.html            # Main page (Jinja2 template)

## Getting Started

### Prerequisites
- Python 3.10 or newer
- pip

### Installation

```bash
# Clone the repo
git clone https://github.com/<your-username>/<your-repo-name>.git
cd <your-repo-name>

# (Recommended) create a virtual environment
python -m venv venv
venv\Scripts\activate       # Windows
source venv/bin/activate    # macOS/Linux

# Install dependencies
pip install -r requirements.txt
```

### Run it

```bash
uvicorn app:app --reload --port 8000
```

Then open **http://localhost:8000** in your browser.

## API Reference

The backend also exposes a small JSON API:

| Method | Endpoint       | Description                          |
|--------|----------------|---------------------------------------|
| GET    | `/`            | Serves the game page                  |
| POST   | `/api/move`    | Submits a board state, returns the AI's move |
| POST   | `/api/reset`   | Returns a fresh game state            |
| GET    | `/api/health`  | Health check                          |
| GET    | `/docs`        | Interactive Swagger API docs          |

## Roadmap / Ideas

- [ ] Move game state management to the server (HTMX) so no JS is required for gameplay logic
- [ ] Online multiplayer
- [ ] Difficulty-based AI "personality" messages


## Acknowledgments

Built with FastAPI, Tailwind CSS, and a love of 80s arcade cabinets.
.gitignore
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
dist/
*.egg-info/

# Virtual environments
venv/
.venv/
env/
ENV/

# Environment variables
.env


.DS_Store
Thumbs.db
