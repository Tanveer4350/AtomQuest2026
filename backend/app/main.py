from datetime import datetime, timezone
from contextlib import asynccontextmanager

from fastapi import FastAPI, Query, WebSocket, WebSocketDisconnect
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


class RealtimeClients:
    def __init__(self) -> None:
        self.connections: set[WebSocket] = set()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.connections.add(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        self.connections.discard(websocket)

    async def broadcast(self, payload: dict) -> None:
        disconnected = []
        for websocket in self.connections:
            try:
                await websocket.send_json(payload)
            except (WebSocketDisconnect, RuntimeError):
                disconnected.append(websocket)
        for websocket in disconnected:
            self.disconnect(websocket)


realtime_clients = RealtimeClients()
# Create the local database for scripts and test clients that do not run lifespan.
init_db()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "faniq-api"}


@app.websocket("/api/realtime")
async def realtime(websocket: WebSocket) -> None:
    await realtime_clients.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        realtime_clients.disconnect(websocket)


@app.post("/api/recommendations", response_model=DecisionRecord)
async def create_recommendation(request: RecommendationRequest) -> DecisionRecord:
    base, final = recommend(request)
    recommendation = Recommendation(
        state=final.state,
        base_state=base.state,
        explanation=final.explanation,
        rules_triggered=final.rules_triggered,
        feedback_applied=request.feedback if request.apply_feedback else None,
        created_at=datetime.now(timezone.utc),
    )
    result = save_decision(request, recommendation)
    await realtime_clients.broadcast({"type": "recommendation", "data": result.model_dump(mode="json")})
    return result


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
