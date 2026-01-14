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
        // REQUIRED: You must allow this to fail gracefully if no credentials are present
        // For now, we'll try applicationDefault() which works if GOOGLE_APPLICATION_CREDENTIALS is set
        // OR we can leave it uninitialized if we want to mock it.

        // Since we don't have the private key, passing the partial serviceAccount to cert() was causing a crash.
        // Let's try to use applicationDefault() first, and if that fails, we fallback to a mock.
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: "cv-ai-7050e"
        });
    }
} catch (error) {
    console.warn("Firebase Admin failed to initialize:", error.message);
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
