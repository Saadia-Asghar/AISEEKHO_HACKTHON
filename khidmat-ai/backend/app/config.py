from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    gemini_api_key: str = ""
    firebase_project_id: str = "demo-khidmat-ai"
    google_maps_api_key: str = ""
    cloud_tasks_queue: str = ""
    cloud_tasks_location: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
