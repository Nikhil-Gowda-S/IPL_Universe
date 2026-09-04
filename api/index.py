"""Vercel entry point for the IPL Universe FastAPI backend."""

# Vercel's Python runtime exposes api/index.py as the /api function.
# The runtime strips the /api function prefix before handing the request
# to the ASGI application, so the existing FastAPI routes can be exported
# directly without mounting them under another /api prefix.
from server import app

__all__ = ["app"]
