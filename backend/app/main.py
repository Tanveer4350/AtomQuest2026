from datetime import datetime, timezone
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .database import clear_decisions, init_db, list_decisions, save_decision
from .rules import recommend
from .schemas import (
    EnergyEstimate,
    EnergyRequest,
    Recommendation,
    RecommendationRequest,
    DecisionRecord,
)


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="FanIQ API",
    description="Explainable, software-only fan automation for simulated rooms.",
    version="1.0.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Create the local database for scripts and test clients that do not run lifespan.
init_db()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "faniq-api"}


@app.post("/api/recommendations", response_model=DecisionRecord)
def create_recommendation(request: RecommendationRequest) -> DecisionRecord:
    base, final = recommend(request)
    recommendation = Recommendation(
        state=final.state,
        base_state=base.state,
        explanation=final.explanation,
        rules_triggered=final.rules_triggered,
        feedback_applied=request.feedback if request.apply_feedback else None,
        created_at=datetime.now(timezone.utc),
    )
    return save_decision(request, recommendation)


@app.get("/api/history", response_model=list[DecisionRecord])
def history(limit: int = Query(default=30, ge=1, le=100)) -> list[DecisionRecord]:
    return list_decisions(limit)


@app.delete("/api/history", status_code=204)
def delete_history() -> None:
    clear_decisions()


@app.post("/api/energy", response_model=EnergyEstimate)
def energy(request: EnergyRequest) -> EnergyEstimate:
    estimates = {
        state: round(watts * request.hours / 1000, 3)
        for state, watts in request.power_watts.items()
    }
    return EnergyEstimate(
        hours=request.hours,
        estimates=estimates,
        assumptions="Estimated energy = power (W) × duration (hours) / 1000. Values are assumptions, not measurements.",
    )
