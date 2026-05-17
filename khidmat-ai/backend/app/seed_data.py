import random
from app.firebase_init import db

def seed_providers():
    providers_ref = db.collection("providers")
    
    # Check if already seeded
    existing_docs = providers_ref.limit(1).get()
    if existing_docs:
        print("Already seeded")
        return

    providers = [
        {
            "provider_id": "PRV-001",
            "name": "Ali AC Services",
            "service_categories": ["ac_repair"],
            "location": {"lat": 33.6844, "lng": 73.0479, "area": "G-13"},
            "rating": 4.8,
            "is_available": True,
            "price_tier": "medium",
            "phone": "+92-300-1111111",
            "experience_years": 8
        },
        {
            "provider_id": "PRV-002",
            "name": "Irfan Plumber",
            "service_categories": ["plumber"],
            "location": {"lat": 33.7175, "lng": 73.0613, "area": "F-7"},
            "rating": 4.5,
            "is_available": True,
            "price_tier": "low",
            "phone": "+92-300-2222222",
            "experience_years": 12
        },
        {
            "provider_id": "PRV-003",
            "name": "Kamran Electrician",
            "service_categories": ["electrician"],
            "location": {"lat": 33.6765, "lng": 73.0033, "area": "G-11"},
            "rating": 4.2,
            "is_available": False,
            "price_tier": "low",
            "phone": "+92-300-3333333",
            "experience_years": 5
        },
        {
            "provider_id": "PRV-004",
            "name": "Sara Tutor (Math/Sci)",
            "service_categories": ["tutor"],
            "location": {"lat": 33.6688, "lng": 73.0746, "area": "I-8"},
            "rating": 4.9,
            "is_available": True,
            "price_tier": "high",
            "phone": "+92-300-4444444",
            "experience_years": 6
        },
        {
            "provider_id": "PRV-005",
            "name": "Glamour Beauty Salon",
            "service_categories": ["beautician"],
            "location": {"lat": 33.7291, "lng": 73.0406, "area": "E-7"},
            "rating": 4.7,
            "is_available": True,
            "price_tier": "high",
            "phone": "+92-300-5555555",
            "experience_years": 10
        },
        {
            "provider_id": "PRV-006",
            "name": "Nawaz Carpenter",
            "service_categories": ["carpenter"],
            "location": {"lat": 33.5358, "lng": 73.1118, "area": "DHA"},
            "rating": 4.1,
            "is_available": True,
            "price_tier": "medium",
            "phone": "+92-300-6666666",
            "experience_years": 15
        },
        {
            "provider_id": "PRV-007",
            "name": "ColorPro Painters",
            "service_categories": ["painter"],
            "location": {"lat": 33.5414, "lng": 73.1147, "area": "Bahria Town"},
            "rating": 4.4,
            "is_available": False,
            "price_tier": "medium",
            "phone": "+92-300-7777777",
            "experience_years": 7
        },
        {
            "provider_id": "PRV-008",
            "name": "Safe Journey Drivers",
            "service_categories": ["driver"],
            "location": {"lat": 33.6844, "lng": 73.0479, "area": "G-13"},
            "rating": 4.6,
            "is_available": True,
            "price_tier": "low",
            "phone": "+92-300-8888888",
            "experience_years": 20
        },
        {
            "provider_id": "PRV-009",
            "name": "Sparkle Cleaning",
            "service_categories": ["cleaning"],
            "location": {"lat": 33.7175, "lng": 73.0613, "area": "F-7"},
            "rating": 4.3,
            "is_available": True,
            "price_tier": "medium",
            "phone": "+92-300-9999999",
            "experience_years": 3
        },
        {
            "provider_id": "PRV-010",
            "name": "BugBusters Pest Control",
            "service_categories": ["pest_control"],
            "location": {"lat": 33.6765, "lng": 73.0033, "area": "G-11"},
            "rating": 4.8,
            "is_available": True,
            "price_tier": "high",
            "phone": "+92-300-1010101",
            "experience_years": 9
        },
        {
            "provider_id": "PRV-011",
            "name": "Bilal AC Masters",
            "service_categories": ["ac_repair"],
            "location": {"lat": 33.6688, "lng": 73.0746, "area": "I-8"},
            "rating": 4.0,
            "is_available": True,
            "price_tier": "low",
            "phone": "+92-300-1212121",
            "experience_years": 4
        },
        {
            "provider_id": "PRV-012",
            "name": "F-7 Emergency Plumbers",
            "service_categories": ["plumber"],
            "location": {"lat": 33.7175, "lng": 73.0613, "area": "F-7"},
            "rating": 4.9,
            "is_available": False,
            "price_tier": "high",
            "phone": "+92-300-1313131",
            "experience_years": 11
        },
        {
            "provider_id": "PRV-013",
            "name": "Zahid Electricals",
            "service_categories": ["electrician"],
            "location": {"lat": 33.7291, "lng": 73.0406, "area": "E-7"},
            "rating": 4.5,
            "is_available": True,
            "price_tier": "medium",
            "phone": "+92-300-1414141",
            "experience_years": 8
        },
        {
            "provider_id": "PRV-014",
            "name": "I-8 Science Academy",
            "service_categories": ["tutor"],
            "location": {"lat": 33.6688, "lng": 73.0746, "area": "I-8"},
            "rating": 4.7,
            "is_available": True,
            "price_tier": "medium",
            "phone": "+92-300-1515151",
            "experience_years": 5
        },
        {
            "provider_id": "PRV-015",
            "name": "Sana Makeup Artist",
            "service_categories": ["beautician"],
            "location": {"lat": 33.5358, "lng": 73.1118, "area": "DHA"},
            "rating": 4.6,
            "is_available": True,
            "price_tier": "high",
            "phone": "+92-300-1616161",
            "experience_years": 7
        },
        {
            "provider_id": "PRV-016",
            "name": "WoodWorks Islamabad",
            "service_categories": ["carpenter"],
            "location": {"lat": 33.6844, "lng": 73.0479, "area": "G-13"},
            "rating": 3.9,
            "is_available": True,
            "price_tier": "low",
            "phone": "+92-300-1717171",
            "experience_years": 18
        },
        {
            "provider_id": "PRV-017",
            "name": "Creative Walls",
            "service_categories": ["painter"],
            "location": {"lat": 33.7175, "lng": 73.0613, "area": "F-7"},
            "rating": 4.3,
            "is_available": True,
            "price_tier": "medium",
            "phone": "+92-300-1818181",
            "experience_years": 6
        },
        {
            "provider_id": "PRV-018",
            "name": "Reliable Rides",
            "service_categories": ["driver"],
            "location": {"lat": 33.5414, "lng": 73.1147, "area": "Bahria Town"},
            "rating": 4.8,
            "is_available": False,
            "price_tier": "high",
            "phone": "+92-300-1919191",
            "experience_years": 14
        },
        {
            "provider_id": "PRV-019",
            "name": "Deep Clean Services",
            "service_categories": ["cleaning"],
            "location": {"lat": 33.6765, "lng": 73.0033, "area": "G-11"},
            "rating": 4.2,
            "is_available": True,
            "price_tier": "low",
            "phone": "+92-300-2020202",
            "experience_years": 2
        },
        {
            "provider_id": "PRV-020",
            "name": "Termite Terminators",
            "service_categories": ["pest_control"],
            "location": {"lat": 33.6844, "lng": 73.0479, "area": "G-13"},
            "rating": 4.7,
            "is_available": True,
            "price_tier": "medium",
            "phone": "+92-300-2121212",
            "experience_years": 10
        }
    ]

    for p in providers:
        providers_ref.document(p["provider_id"]).set(p)
    
    print(f"Successfully seeded {len(providers)} providers")

if __name__ == "__main__":
    seed_providers()
