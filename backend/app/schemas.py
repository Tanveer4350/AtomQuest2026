from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class FanState(str, Enum):
    OFF = "off"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    MAXIMUM = "maximum"


class ComfortFeedback(str, Enum):
    TOO_WARM = "too_warm"
    COMFORTABLE = "comfortable"
    TOO_COOL = "too_cool"


class RecommendationRequest(BaseModel):
    temperature_c: float = Field(..., ge=-10, le=60)
    humidity_percent: float = Field(..., ge=0, le=100)
    occupied: bool = True
    quiet_hours: bool = False
    feedback: ComfortFeedback | None = None
    apply_feedback: bool = True


class Recommendation(BaseModel):
    state: FanState
    base_state: FanState
    explanation: str
    rules_triggered: list[str]
    feedback_applied: ComfortFeedback | None = None
    created_at: datetime


class DecisionRecord(RecommendationRequest):
    id: int
    recommendation: Recommendation


class FeedbackRequest(BaseModel):
    feedback: ComfortFeedback


class EnergyRequest(BaseModel):
    hours: float = Field(..., gt=0, le=24 * 365)
    power_watts: dict[FanState, float] = Field(
        default={
            FanState.OFF: 0,
            FanState.LOW: 25,
            FanState.MEDIUM: 40,
            FanState.HIGH: 55,
            FanState.MAXIMUM: 70,
        }
    )


class EnergyEstimate(BaseModel):
    hours: float
    estimates: dict[FanState, float]
    assumptions: str
