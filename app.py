"""Compatibility launcher; install backend dependencies first."""
from backend.app.detection import *  # noqa: F401,F403

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000)
