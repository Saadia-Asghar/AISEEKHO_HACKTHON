import pytest
from app.agents.ranking_agent import RankingAgent

def test_scoring_formula():
    agent = RankingAgent()
    
    # Mock intent for scheduled
    intent_scheduled = {"urgency_level": "scheduled"}
    # Mock intent for asap
    intent_asap = {"urgency_level": "asap"}
    
    provider_perfect = {
        "name": "Perfect Provider",
        "distance_km": 0.0,
        "rating": 5.0,
        "is_available": True,
        "price_tier": "low"
    }
    
    # Test perfect provider for scheduled
    # dist: 1.0 * 0.35 = 0.35
    # rating: 1.0 * 0.30 = 0.30
    # avail: 1.0 * 0.25 = 0.25
    # price: 1.0 * 0.10 = 0.10
    # total = 1.0
    res = agent.rank([dict(provider_perfect)], intent_scheduled)["ranked_providers"][0]
    assert res["match_score"] == 1.0
    
    # Test distance deduction (5km -> 0.5 distance score)
    # dist: 0.5 * 0.35 = 0.175
    # total: 0.175 + 0.30 + 0.25 + 0.10 = 0.825
    provider_far = dict(provider_perfect, distance_km=5.0)
    res = agent.rank([provider_far], intent_scheduled)["ranked_providers"][0]
    assert res["match_score"] == 0.825
    
    # Test rating deduction (2.5 -> 0.5 rating score)
    # rating: 0.5 * 0.30 = 0.15
    # total: 0.35 + 0.15 + 0.25 + 0.10 = 0.85
    provider_low_rate = dict(provider_perfect, rating=2.5)
    res = agent.rank([provider_low_rate], intent_scheduled)["ranked_providers"][0]
    assert res["match_score"] == 0.85
    
    # Test ASAP urgency override
    # price score is ignored, avail weight becomes 0.35
    # For perfect provider, avail weight goes up to 0.35, price is 0.0, wait...
    # The prompt says: override: use availability_score * 0.35, price * 0.0
    # dist: 0.35, rating: 0.30, avail: 1.0 * 0.35 = 0.35, total = 1.0
    provider_expensive = dict(provider_perfect, price_tier="high")
    res_asap = agent.rank([provider_expensive], intent_asap)["ranked_providers"][0]
    # Under ASAP, an expensive provider gets full score if close and available
    assert res_asap["match_score"] == 1.0
    
    # Under scheduled, an expensive provider loses points
    # price_val = 0.3, price: 0.3 * 0.10 = 0.03
    # dist: 0.35, rating: 0.30, avail: 0.25
    # total: 0.35 + 0.30 + 0.25 + 0.03 = 0.93
    res_sched = agent.rank([provider_expensive], intent_scheduled)["ranked_providers"][0]
    assert res_sched["match_score"] == 0.93
