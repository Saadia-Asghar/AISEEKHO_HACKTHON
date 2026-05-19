# KhidmatAI Next Steps & Setup Guide

This document outlines what is left to complete in the KhidmatAI project and provides step-by-step instructions on attaching real authentication (Firebase) and configuring the necessary API keys.

---

## 1. Environment Variables & API Keys Setup

Right now, the backend relies on an `.env` file to securely access external services. Without these keys, AI orchestration and geocoding will fail.

### Action Item: Create the Production Backend `.env`

1. Go to your `backend/` folder.
2. Make a copy of `backend/.env.example` and name it `.env`.
3. Fill in the following essential keys:
   - **`GOOGLE_API_KEY`**: This is required for the Gemini AI orchestrator and speech-to-text. You can get this from [Google AI Studio](https://aistudio.google.com/).
   - **`GOOGLE_MAPS_API_KEY`**: This is required for geocoding user locations. You can get this from the [Google Cloud Console](https://console.cloud.google.com/).

### Optional Keys:
- **`STRIPE_SECRET_KEY`**: If you intend to implement real payments.
- **`TWILIO_ACCOUNT_SID` & `TWILIO_AUTH_TOKEN`**: If you want to use the local DB but send real SMS for OTPs instead of the mock "1234" code.

---

## 2. Moving from Mock Auth to Firebase Phone Authentication

Currently, the mobile app and backend use a mocked authentication system (submitting any phone number with the OTP `"1234"` instantly logs you in). For a production app, **Firebase Phone Auth** is recommended.

### Step A: Configure Firebase Console
1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. Navigate to **Authentication > Sign-in method** and enable **Phone** provider.
3. Under **Project Settings > Service Accounts**, generate a new private key JSON.
4. Download this JSON file and save it in your `backend/` folder (e.g., name it `firebase-adminsdk.json`).

### Step B: Update the Mobile App (`khidmat-ai/mobile`)
1. Open your terminal, navigate to `khidmat-ai/mobile`, and install the Firebase client SDK:
   ```bash
   npm install firebase
   ```
2. Create a `firebaseConfig.ts` file in your `lib/` directory using the config details from your Firebase project settings.
3. In `mobile/app/auth.tsx`, replace the mock `send_otp` logic with Firebase's `signInWithPhoneNumber()` method. 
4. Once the user enters the OTP in the app, Firebase will return an **ID Token**. You must pass this ID Token to your backend instead of the raw OTP.

### Step C: Update the Backend (`backend`)
1. In the `backend` folder, install the Firebase Admin SDK:
   ```bash
   pip install firebase-admin
   ```
2. Initialize Firebase in your backend `main.py`:
   ```python
   import firebase_admin
   from firebase_admin import credentials
   
   cred = credentials.Certificate("firebase-adminsdk.json")
   firebase_admin.initialize_app(cred)
   ```
3. Update `backend/app/routers/otp_auth.py` to verify the ID token sent from the mobile app, instead of hardcoding "1234":
   ```python
   from firebase_admin import auth
   
   # Inside your verify endpoint:
   try:
       decoded_token = auth.verify_id_token(body.firebase_id_token)
       phone_number = decoded_token['phone_number']
       # Look up or create the user in your SQLite DB based on this verified phone_number
   except Exception as e:
       raise HTTPException(status_code=401, detail="Invalid Firebase Token")
   ```

---

## 3. Other Pending Tasks

- **Test Mobile Builds**: Run `npx expo start` and test the UI on a physical device. Make sure the bundle size isn't causing lag.
- **Connect Web Dashboard (Optional)**: The `web/` folder contains a Next.js boilerplate. You can wire it up to fetch stats directly from the FastAPI `/health` endpoint or create admin endpoints.
- **Run Backend Tests**: A GitHub action has been set up to test the backend, but writing a few integration tests for the orchestrator (using `pytest`) will ensure everything remains stable.
