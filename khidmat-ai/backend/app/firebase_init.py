import os
import firebase_admin
from firebase_admin import credentials, firestore, messaging
from app.config import settings

def init_firebase():
    try:
        firebase_admin.get_app()
    except ValueError:
        if os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
            cred = credentials.ApplicationDefault()
            firebase_admin.initialize_app(cred)
        else:
            # Initialize with project_id from settings
            firebase_admin.initialize_app(options={'projectId': settings.firebase_project_id})

init_firebase()

# Export db and messaging clients
db = firestore.client()
# messaging is already imported from firebase_admin, it acts as the FCM client module
