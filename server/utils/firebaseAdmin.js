const admin = require('firebase-admin');

// Initialize Firebase Admin with default application credentials
// Uses the same Firebase project as the client app
const serviceAccount = {
    projectId: "cv-ai-7050e",
    // For development, we'll use the default credentials
    // In production, use a service account key file
};

// Check if already initialized
try {
    if (!admin.apps.length) {
        let credential;

        // Option 1: Env Var contains the JSON string (Best for Render/Vercel)
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            credential = admin.credential.cert(serviceAccount);
        }
        // Option 2: GOOGLE_APPLICATION_CREDENTIALS file path
        else {
            credential = admin.credential.applicationDefault();
        }

        admin.initializeApp({
            credential,
            projectId: "cv-ai-7050e"
        });
        console.log("Firebase Admin initialized successfully");
    }
} catch (error) {
    console.warn("Firebase Admin warning:", error.message);
    console.warn("Database features will not work until credentials are set up.");
}

// Export a robust db object that won't crash the server if Firebase isn't set up
let db;
try {
    db = admin.firestore();
} catch (error) {
    console.warn("Firestore not available:", error.message);
    // Mock DB to prevent crashes on routes that import 'db'
    db = {
        collection: () => ({
            add: async () => { throw new Error("Firebase not configured"); },
            get: async () => ({ docs: [], forEach: () => { } }),
            orderBy: () => ({ get: async () => ({ docs: [], forEach: () => { } }) }),
            doc: () => ({ update: async () => { throw new Error("Firebase not configured"); } })
        })
    };
}

module.exports = { admin, db };
