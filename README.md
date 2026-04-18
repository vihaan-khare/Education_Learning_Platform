# Education Learning Platform

This project is a React application utilizing Vite, TensorFlow.js (for facial landmark detection), and Firebase for authentication and database management. 

## Setting Up the Project

### Prerequisites
- Node.js (v16+ recommended)
- A Firebase account

### Installation
1. Clone the repository and navigate to the project directory:
   ```bash
   cd Education_Learning_Platform
   ```
2. Install the necessary dependencies:
   ```bash
   npm install
   ```

### Connecting to Firebase
This application uses Firebase for Authentication and Firestore (Database).

#### 1. Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click "Add project" and follow the onscreen instructions.
3. Once the project is created, navigate to **Build > Authentication**, click "Get Started", and enable the **Email/Password** sign-in method.
4. Navigate to **Build > Firestore Database**, click "Create database", select "Start in Test mode" (for development purposes) and choose a location.

#### 2. Get Firebase Configuration
1. In the Firebase Console, go to **Project Overview** and click the Web icon (`</>`) to add a Firebase app to your project.
2. Register the app with a nickname.
3. Firebase will provide a configuration object that looks like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

#### 3. Update Environment Variables
1. Ensure there is a `.env` file at the root of your project directory. (You can copy `.env.example` to `.env`).
2. Add your Firebase configuration keys that you obtained in the step above:
   ```env
   VITE_FIREBASE_API_KEY="YOUR_API_KEY"
   VITE_FIREBASE_AUTH_DOMAIN="YOUR_PROJECT_ID.firebaseapp.com"
   VITE_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
   VITE_FIREBASE_STORAGE_BUCKET="YOUR_PROJECT_ID.appspot.com"
   VITE_FIREBASE_MESSAGING_SENDER_ID="YOUR_SENDER_ID"
   VITE_FIREBASE_APP_ID="YOUR_APP_ID"
   ```

### Running the Project Locally
Once dependencies are installed and Firebase is configured:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.
