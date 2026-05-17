import time
import math
import httpx
from typing import Dict, Any, List, Tuple

def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    # Radius of earth in kilometers
    R = 6371.0
    
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

class DiscoveryAgent:
    def __init__(self, db, maps_api_key: str):
        self.db = db
        self.maps_api_key = maps_api_key

    async def discover(self, intent: Dict[str, Any], user_lat: float, user_lng: float) -> Dict[str, Any]:
        start_time = time.time()
        service_type = intent.get("service_type", "")
        
        candidates = []
        seen_ids = set()
        
        # 1. Query Firestore
        try:
            # Note: A real app might index this or do a full text search, here we use simple where
            if service_type:
                query = self.db.collection("providers").where("service_categories", "array_contains", service_type)
            else:
                query = self.db.collection("providers")
                
            docs = query.stream()
            for doc in docs:
                p = doc.to_dict()
                loc = p.get("location", {})
                plat = loc.get("lat")
                plng = loc.get("lng")
                if plat and plng:
                    dist = haversine(user_lat, user_lng, plat, plng)
                    if dist <= 10.0:
                        p["distance_km"] = round(dist, 2)
                        candidates.append(p)
                        seen_ids.add(p.get("provider_id"))
        except Exception as e:
            print(f"Firestore discovery error: {e}")
            
        # 4. Fallback to Google Places API if < 3 results
        if len(candidates) < 3 and self.maps_api_key and self.maps_api_key != "dummy_key":
            try:
                url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
                params = {
                    "location": f"{user_lat},{user_lng}",
                    "radius": 10000,
                    "keyword": service_type,
                    "key": self.maps_api_key
                }
                async with httpx.AsyncClient() as client:
                    resp = await client.get(url, params=params)
                    if resp.status_code == 200:
                        data = resp.json()
                        for place in data.get("results", []):
                            place_id = place.get("place_id")
                            if place_id in seen_ids:
                                continue
                                
                            plat = place["geometry"]["location"]["lat"]
                            plng = place["geometry"]["location"]["lng"]
                            dist = haversine(user_lat, user_lng, plat, plng)
                            
                            p = {
                                "provider_id": place_id,
                                "name": place.get("name"),
                                "service_categories": [service_type],
                                "location": {"lat": plat, "lng": plng, "area": place.get("vicinity", "")},
                                "rating": place.get("rating", 4.0),
                                "is_available": True,
                                "price_tier": "medium", # Default assumption
                                "phone": "N/A",
                                "experience_years": 0,
                                "distance_km": round(dist, 2)
                            }
                            candidates.append(p)
                            seen_ids.add(place_id)
            except Exception as e:
                print(f"Google Places API error: {e}")
                
        # 5. Return up to 10 candidates
        candidates = candidates[:10]
        
        duration_ms = int((time.time() - start_time) * 1000)
        log_entry = {
            "step_number": 2,
            "agent_name": "DiscoveryAgent",
            "action": "discover_providers",
            "input": {"service_type": service_type, "lat": user_lat, "lng": user_lng},
            "output": f"Found {len(candidates)} providers within 10km radius",
            "duration_ms": duration_ms
        }
        
        return {
            "providers": candidates,
            "log": log_entry
        }
