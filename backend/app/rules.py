"""Deterministic and explainable recommendation rules."""

from dataclasses import dataclass

from .schemas import ComfortFeedback, FanState, RecommendationRequest


ORDER = [FanState.OFF, FanState.LOW, FanState.MEDIUM, FanState.HIGH, FanState.MAXIMUM]


@dataclass(frozen=True)
class RuleResult:
    state: FanState
    explanation: str
    rules_triggered: list[str]


def _increase(state: FanState, amount: int = 1) -> FanState:
    return ORDER[min(len(ORDER) - 1, ORDER.index(state) + amount)]


def _decrease(state: FanState, amount: int = 1) -> FanState:
    return ORDER[max(0, ORDER.index(state) - amount)]


def recommend_base(request: RecommendationRequest) -> RuleResult:
    """Evaluate baseline rules; priority is occupancy, temperature, then humidity."""
    if not request.occupied:
        return RuleResult(FanState.OFF, "Room is unoccupied, so the fan is off.", ["unoccupied"])

    rules: list[str] = []
    if request.temperature_c >= 34:
        state = FanState.MAXIMUM
        rules.append("very_warm")
    elif request.temperature_c >= 29:
        state = FanState.HIGH
        rules.append("warm")
    elif request.temperature_c >= 25:
        state = FanState.MEDIUM
        rules.append("moderate_temperature")
    else:
        state = FanState.LOW
        rules.append("comfortable_temperature")

    if request.humidity_percent >= 75:
        state = _increase(state)
        rules.append("high_humidity")
    elif request.humidity_percent >= 65:
        rules.append("elevated_humidity")
    elif request.humidity_percent < 35 and state != FanState.LOW:
        state = _decrease(state)
        rules.append("dry_air")

    if request.quiet_hours and state.value not in (FanState.OFF.value, FanState.LOW.value):
        state = FanState.LOW
        rules.append("quiet_hours_cap")

    explanation = {
        FanState.OFF: "Conditions permit the fan to remain off.",
        FanState.LOW: "A gentle airflow is recommended for the current conditions.",
        FanState.MEDIUM: "Moderate airflow balances comfort and noise.",
        FanState.HIGH: "Stronger airflow is recommended because the room is warm.",
        FanState.MAXIMUM: "Maximum airflow is recommended because the room is very warm or humid.",
    }[state]
    return RuleResult(state, explanation, rules)


def apply_feedback(result: RuleResult, feedback: ComfortFeedback | None, quiet_hours: bool) -> RuleResult:
    if feedback is None:
        return result
    adjusted = result.state
    if feedback == ComfortFeedback.TOO_WARM:
        adjusted = _increase(adjusted)
        reason = "Feedback increased airflow because the user feels too warm."
    elif feedback == ComfortFeedback.TOO_COOL:
        adjusted = _decrease(adjusted)
        reason = "Feedback reduced airflow because the user feels too cool."
    else:
        reason = "Comfort feedback confirms the current recommendation."
    if quiet_hours:
        adjusted = min((adjusted, FanState.LOW), key=ORDER.index)
        if adjusted != result.state:
            reason += " Quiet hours still cap the recommendation at low."
    rules = [*result.rules_triggered, f"feedback_{feedback.value}"]
    return RuleResult(adjusted, reason, rules)


def recommend(request: RecommendationRequest) -> tuple[RuleResult, RuleResult]:
    base = recommend_base(request)
    final = apply_feedback(base, request.feedback if request.apply_feedback else None, request.quiet_hours)
    return base, final
