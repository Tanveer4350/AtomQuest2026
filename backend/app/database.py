import json
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from .schemas import DecisionRecord, RecommendationRequest, Recommendation


DB_PATH = Path(os.getenv("FANIQ_DB_PATH", Path(__file__).resolve().parents[1] / "faniq.db"))


def connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with connection() as conn:
        conn.execute(
            """CREATE TABLE IF NOT EXISTS decisions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                payload TEXT NOT NULL,
                recommendation TEXT NOT NULL,
                created_at TEXT NOT NULL
            )"""
        )


def save_decision(request: RecommendationRequest, recommendation: Recommendation) -> DecisionRecord:
    created_at = recommendation.created_at.isoformat()
    with connection() as conn:
        cursor = conn.execute(
            "INSERT INTO decisions (payload, recommendation, created_at) VALUES (?, ?, ?)",
            (request.model_dump_json(), recommendation.model_dump_json(), created_at),
        )
        return DecisionRecord(id=cursor.lastrowid, **request.model_dump(), recommendation=recommendation)


def list_decisions(limit: int = 50) -> list[DecisionRecord]:
    with connection() as conn:
        rows = conn.execute(
            "SELECT id, payload, recommendation FROM decisions ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
    return [
        DecisionRecord(
            id=row["id"],
            **json.loads(row["payload"]),
            recommendation=Recommendation.model_validate_json(row["recommendation"]),
        )
        for row in rows
    ]


def clear_decisions() -> None:
    with connection() as conn:
        conn.execute("DELETE FROM decisions")
