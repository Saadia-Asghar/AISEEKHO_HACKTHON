import time
from typing import Dict, Any, List
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate

class DecisionAgent:
    def __init__(self, api_key: str):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=api_key,
            temperature=0.7
        )
        self.prompt = PromptTemplate(
            template="""You selected {provider_name} for a {service_type} request.
They are {distance}km away, rated {rating}★, and are currently available.
Write one natural sentence in the same language as: '{original_request}'
explaining why they are the best choice. Be concise.""",
            input_variables=["provider_name", "service_type", "distance", "rating", "original_request"]
        )

    async def decide(self, ranked_providers: List[Dict[str, Any]], intent: Dict[str, Any], original_request: str = "") -> Dict[str, Any]:
        start_time = time.time()
        
        if not ranked_providers:
            return {
                "selected_provider": None,
                "explanation": "No suitable providers found.",
                "alternatives": [],
                "log": {
                    "step_number": 4,
                    "agent_name": "DecisionAgent",
                    "action": "select_best",
                    "input": "0 candidates",
                    "output": "No providers selected",
                    "duration_ms": int((time.time() - start_time) * 1000)
                }
            }

        selected_provider = ranked_providers[0]
        alternatives = ranked_providers[1:3]
        
        try:
            _input = self.prompt.format(
                provider_name=selected_provider.get("name"),
                service_type=intent.get("service_type", "service"),
                distance=selected_provider.get("distance_km"),
                rating=selected_provider.get("rating"),
                original_request=original_request if original_request else intent.get("service_type", "service")
            )
            response = await self.llm.ainvoke(_input)
            explanation = response.content.strip()
        except Exception as e:
            print(f"DecisionAgent LLM error: {e}")
            explanation = f"Selected {selected_provider.get('name')} as the best available option."
            
        duration_ms = int((time.time() - start_time) * 1000)
        log_entry = {
            "step_number": 4,
            "agent_name": "DecisionAgent",
            "action": "select_best",
            "input": f"top {len(ranked_providers)} ranked providers",
            "output": f"Selected: {selected_provider.get('name')} — {explanation}",
            "duration_ms": duration_ms
        }
        
        return {
            "selected_provider": selected_provider,
            "explanation": explanation,
            "alternatives": alternatives,
            "log": log_entry
        }
