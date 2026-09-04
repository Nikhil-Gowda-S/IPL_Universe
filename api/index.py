"""Vercel entry point for the IPL Universe FastAPI backend."""

from fastapi import FastAPI

from server import app as backend_app

# Vercel routes /api/* requests to this function. Mount the existing
# FastAPI application below /api so its existing routes (/predict, /health,
# /teams, /venues, /players/...) remain unchanged.
app = FastAPI(title="IPL Universe API")
app.mount("/api", backend_app)
