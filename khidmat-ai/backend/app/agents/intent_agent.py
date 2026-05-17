import time
from typing import Dict, Any, Tuple
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.output_parsers import ResponseSchema, StructuredOutputParser
from langchain.prompts import PromptTemplate

class IntentAgent:
    def __init__(self, api_key: str):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash", 
            google_api_key=api_key,
            temperature=0.0
        )
        
        self.response_schemas = [
            ResponseSchema(name="service_type", description="The type of service requested (e.g. 'ac_repair', 'plumber', 'tutor', 'electrician')"),
            ResponseSchema(name="location", description="The location for the service (e.g. 'G-13', 'F-7 Islamabad')"),
            ResponseSchema(name="time_slot", description="The requested time for the service (e.g. 'tomorrow 10am', 'ASAP', 'today evening')"),
            ResponseSchema(name="urgency_level", description="The urgency of the request. Must be one of: 'asap', 'scheduled', 'flexible'"),
            ResponseSchema(name="language_detected", description="The language of the user input. Must be one of: 'en', 'ur', 'roman_ur'"),
            ResponseSchema(name="clarification_needed", description="True if the input is too ambiguous to determine the service or location, False otherwise.", type="boolean"),
            ResponseSchema(name="clarification_question", description="If clarification is needed, what should be asked? Otherwise empty string.")
        ]
        
        self.output_parser = StructuredOutputParser.from_response_schemas(self.response_schemas)
        self.format_instructions = self.output_parser.get_format_instructions()
        
        self.prompt = PromptTemplate(
            template="""You are an intent parsing agent for a local service marketplace in Islamabad.
Extract the user's intent into the specified JSON format.

Handle English, Urdu script, and Roman Urdu.
Map common Roman Urdu/Urdu time words:
- "kal subah" -> "tomorrow morning"
- "abhi" -> "ASAP"
- "kal sham" -> "tomorrow evening"
- "parson" -> "day after tomorrow"

Map common service words:
- "bijli wala" / "electrician" -> "electrician"
- "AC wala" / "AC technician" -> "ac_repair"
- "naali" / "plumber" -> "plumber"
- "ustad" / "teacher" / "tutor" -> "tutor"

Few-shot examples:
1. Input: "I need a plumber tomorrow morning in F-7"
   Output: {{"service_type": "plumber", "location": "F-7", "time_slot": "tomorrow morning", "urgency_level": "scheduled", "language_detected": "en", "clarification_needed": false, "clarification_question": ""}}
2. Input: "Mujhe kal subah G-13 mein AC technician chahiye"
   Output: {{"service_type": "ac_repair", "location": "G-13", "time_slot": "tomorrow morning", "urgency_level": "scheduled", "language_detected": "roman_ur", "clarification_needed": false, "clarification_question": ""}}
3. Input: "bijli wala chahiye abhi"
   Output: {{"service_type": "electrician", "location": "", "time_slot": "ASAP", "urgency_level": "asap", "language_detected": "roman_ur", "clarification_needed": true, "clarification_question": "Aapka location kya hai?"}}
4. Input: "kal sham ko a jana"
   Output: {{"service_type": "", "location": "", "time_slot": "tomorrow evening", "urgency_level": "scheduled", "language_detected": "roman_ur", "clarification_needed": true, "clarification_question": "Aapko konsi service chahiye aur location kya hai?"}}
5. Input: "مجھے کل صبح ٹیوٹر چاہیے"
   Output: {{"service_type": "tutor", "location": "", "time_slot": "tomorrow morning", "urgency_level": "scheduled", "language_detected": "ur", "clarification_needed": true, "clarification_question": "آپ کو کس علاقے میں ٹیوٹر چاہیے؟"}}

User Input: {input}

{format_instructions}""",
            input_variables=["input"],
            partial_variables={"format_instructions": self.format_instructions}
        )
        
    async def parse(self, user_input: str) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        start_time = time.time()
        fallback_dict = {
            "service_type": "",
            "location": "",
            "time_slot": "",
            "urgency_level": "flexible",
            "language_detected": "en",
            "clarification_needed": True,
            "clarification_question": "Could you please clarify your request?"
        }
        
        try:
            _input = self.prompt.format(input=user_input)
            response = await self.llm.ainvoke(_input)
            
            # The prompt troubleshooting reference says:
            # "The IntentAgent is returning malformed JSON. Add a JSON parsing safety wrapper: 
            # if the LLM output cannot be parsed as JSON, strip markdown code fences and try again. 
            # Return the fallback clarification dict if it still fails."
            try:
                parsed_result = self.output_parser.parse(response.content)
            except Exception:
                import json
                cleaned = response.content.replace('```json', '').replace('```', '').strip()
                try:
                    parsed_result = json.loads(cleaned)
                except Exception:
                    parsed_result = fallback_dict
            
            if isinstance(parsed_result.get("clarification_needed"), str):
                parsed_result["clarification_needed"] = parsed_result["clarification_needed"].lower() == "true"
                
            result = parsed_result
        except Exception as e:
            print(f"Error parsing intent: {e}")
            result = fallback_dict
            
        duration_ms = int((time.time() - start_time) * 1000)
        
        log_entry = {
            "step_number": 1,
            "agent_name": "IntentAgent",
            "action": "parse_intent",
            "input": user_input,
            "output": result,
            "duration_ms": duration_ms
        }
        
        return result, log_entry

if __name__ == "__main__":
    import asyncio
    import os
    
    async def test():
        api_key = os.environ.get("GEMINI_API_KEY", "dummy_key")
        agent = IntentAgent(api_key=api_key)
        
        inputs = [
            "I need a plumber tomorrow morning in F-7",
            "Mujhe kal subah G-13 mein AC technician chahiye",
            "bijli wala chahiye abhi"
        ]
        
        for i in inputs:
            print(f"\nInput: {i}")
            try:
                res, log = await agent.parse(i)
                print("Result:", res)
            except Exception as e:
                print("Test failed with missing key error, but syntax is okay.", e)
            
    asyncio.run(test())
