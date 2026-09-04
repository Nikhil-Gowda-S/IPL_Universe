"""Vercel entry point for the IPL Universe FastAPI backend."""

from fastapi import FastAPI

from server import app as backend_app

# Vercel sends /api/* requests to this backend service. Mount the existing
# FastAPI application at /api so its existing routes (/predict, /health,
# /teams, /venues, /players/...) keep their current paths.
app = FastAPI(title="IPL Universe API")
app.mount("/api", backend_app)

__all__ = ["app"]
