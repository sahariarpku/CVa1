import { db } from '../src/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export interface UserSettings {
    aiConfig?: {
        provider: string;
        apiKey: string;
        baseUrl?: string;
        model?: string;
    };
    jobPreferences?: {
        keywords: string;
        location: string;
        minSalary: string;
        jobType: string;
    };
}

export const settingsService = {
    async getSettings(uid: string): Promise<UserSettings | null> {
        try {
            const ref = doc(db, 'users', uid, 'settings', 'main');
            const snap = await getDoc(ref);
            if (snap.exists()) return snap.data() as UserSettings;
            return null;
        } catch (error) {
            console.error("Error fetching settings:", error);
            return null;
        }
    },

    async saveSettings(uid: string, settings: Partial<UserSettings>) {
        try {
            const ref = doc(db, 'users', uid, 'settings', 'main');
            await setDoc(ref, settings, { merge: true });
        } catch (error) {
            console.error("Error saving settings:", error);
            throw error;
        }
    },

    subscribeSettings(uid: string, callback: (settings: UserSettings | null) => void) {
        const ref = doc(db, 'users', uid, 'settings', 'main');
        return onSnapshot(ref, (snap) => {
            if (snap.exists()) callback(snap.data() as UserSettings);
            else callback(null);
        }, (error) => {
            console.error("Error subscribing to settings:", error);
        });
    }
};
