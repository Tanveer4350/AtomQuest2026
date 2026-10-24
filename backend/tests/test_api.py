import os
from pathlib import Path

os.environ["FANIQ_DB_PATH"] = str(Path(__file__).parent / "test.db")

from fastapi.testclient import TestClient
from app.main import app


client = TestClient(app)


def setup_function():
    client.delete("/api/history")


def test_recommendation_is_persisted_and_returned():
    response = client.post(
        "/api/recommendations",
        json={"temperature_c": 28, "humidity_percent": 70, "occupied": True},
    )
    assert response.status_code == 200
    assert response.json()["recommendation"]["state"] == "medium"
    history = client.get("/api/history").json()
    assert len(history) == 1


def test_invalid_input_is_rejected():
    response = client.post(
        "/api/recommendations",
        json={"temperature_c": 100, "humidity_percent": 50},
    )
    assert response.status_code == 422


def test_energy_formula():
    response = client.post("/api/energy", json={"hours": 5})
    assert response.status_code == 200
    assert response.json()["estimates"]["medium"] == 0.2
