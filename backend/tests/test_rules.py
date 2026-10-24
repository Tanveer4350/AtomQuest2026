from app.rules import recommend
from app.schemas import ComfortFeedback, FanState, RecommendationRequest


def test_unoccupied_room_is_off():
    base, final = recommend(RecommendationRequest(temperature_c=40, humidity_percent=90, occupied=False))
    assert base.state == final.state == FanState.OFF


def test_hot_humid_room_reaches_maximum():
    _, final = recommend(RecommendationRequest(temperature_c=35, humidity_percent=80))
    assert final.state == FanState.MAXIMUM


def test_feedback_is_bounded_and_quiet_hours_win():
    _, final = recommend(
        RecommendationRequest(
            temperature_c=35,
            humidity_percent=80,
            quiet_hours=True,
            feedback=ComfortFeedback.TOO_WARM,
        )
    )
    assert final.state == FanState.LOW


def test_feedback_can_reduce_airflow():
    _, final = recommend(
        RecommendationRequest(
            temperature_c=30, humidity_percent=50, feedback=ComfortFeedback.TOO_COOL
        )
    )
    assert final.state == FanState.MEDIUM
