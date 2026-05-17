import time
from typing import Dict, Any, List, Tuple

class RankingAgent:
    def __init__(self):
        pass

    def rank(self, providers: List[Dict[str, Any]], intent: Dict[str, Any]) -> Dict[str, Any]:
        start_time = time.time()
        urgency = intent.get("urgency_level", "flexible")
        
        ranked = []
        scoring_breakdown = []
        
        for p in providers:
            dist = p.get("distance_km", 10.0)
            distance_score = max(0.0, 1 - (dist / 10.0))
            
            rating_score = p.get("rating", 4.0) / 5.0
            
            availability_score = 1.0 if p.get("is_available") else 0.3
            
            ptier = p.get("price_tier", "medium")
            if ptier == "low":
                price_val = 1.0
            elif ptier == "medium":
                price_val = 0.6
            else:
                price_val = 0.3
                
            if urgency == "asap":
                price_score = 0.0
                avail_weight = 0.35
                price_weight = 0.0
            else:
                price_score = price_val
                avail_weight = 0.25
                price_weight = 0.10
                
            score = (distance_score * 0.35) + (rating_score * 0.30) + (availability_score * avail_weight) + (price_score * price_weight)
            
            p["match_score"] = round(score, 3)
            p["rank_explanation"] = self.rank_explanation(p, score)
            ranked.append(p)
            
            scoring_breakdown.append({
                "provider": p.get("name"),
                "score": round(score, 3),
                "dist": round(distance_score, 2),
                "rating": round(rating_score, 2),
                "avail": round(availability_score, 2),
                "price": round(price_score, 2)
            })
            
        ranked.sort(key=lambda x: x["match_score"], reverse=True)
        top_5 = ranked[:5]
        
        duration_ms = int((time.time() - start_time) * 1000)
        log_entry = {
            "step_number": 3,
            "agent_name": "RankingAgent",
            "action": "score_providers",
            "input": f"{len(providers)} candidates",
            "output": [self.rank_explanation(p, p["match_score"]) for p in top_5],
            "duration_ms": duration_ms,
            "breakdown": scoring_breakdown
        }
        
        return {
            "ranked_providers": top_5,
            "log": log_entry
        }

    def rank_explanation(self, provider: Dict[str, Any], score: float) -> str:
        dist = provider.get('distance_km', 'unknown')
        rating = provider.get('rating', 'unknown')
        avail = "available now" if provider.get('is_available') else "busy"
        return f"{provider.get('name')} — {dist}km away, rated {rating}★, {avail} (score: {score:.2f})"
