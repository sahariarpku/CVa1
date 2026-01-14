
import { db } from '../src/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { CVProfile } from '../types';

import { aiService } from './aiService';

const API_BASE = '/api/cv';

export const cvService = {
    // GET Profile (Firestore)
    async getProfile(userId: string): Promise<CVProfile | null> {
        try {
            const docRef = doc(db, 'users', userId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data().profile as CVProfile;
            }
            return null;
        } catch (err) {
            console.error("Firestore get error:", err);
            return null;
        }
    },

    // SAVE Profile (Firestore)
    async saveProfile(profile: CVProfile, userId: string): Promise<boolean> {
        try {
            // Firestore cannot save 'undefined' values. We must sanitize the object.
            const cleanProfile = JSON.parse(JSON.stringify(profile));

            await setDoc(doc(db, 'users', userId), {
                profile: cleanProfile,
                updatedAt: new Date()
            }, { merge: true });
            return true;
        } catch (err) {
            console.error("Firestore save error:", err);
            return false;
        }
    },

    // PARSE CV
    async parseCV(file: File): Promise<Partial<CVProfile> | null> {
        const formData = new FormData();
        formData.append('cv', file);

        try {
            const res = await fetch(`${API_BASE}/parse`, {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error('Parsing failed');
            const data = await res.json();
            return data.data;
        } catch (err) {
            console.error(err);
            return null;
        }
    },

    // ADDRESS LOOKUP (UK Postcodes.io)
    async lookupAddress(postcode: string): Promise<any> {
        try {
            const res = await fetch(`https://api.postcodes.io/postcodes/${postcode}`);
            const data = await res.json();
            if (data.status === 200) {
                return {
                    postcode: data.result.postcode,
                    city: data.result.admin_district || data.result.parish || data.result.parliamentary_constituency,
                    region: data.result.region || data.result.european_electoral_region,
                    country: data.result.country
                };
            }
            return null;
        } catch (err) {
            console.error('Address lookup failed', err);
            return null;
        }
    },

    // IMPROVE TEXT (AI - via aiService)
    async improveText(text: string, type: string = 'general'): Promise<string | null> {
        try {
            const prompt = `
            You are an expert Academic CV Editor. 
            Refine the following ${type} section to be punchy, professional, and impact-driven.
            - Use strong action verbs.
            - Focus on achievements and metrics.
            - Keep it suitable for an academic or research role.
            - Return ONLY the improved text.

            Original Text:
            "${text}"
            `;

            // Use the centralized AI service which handles DeepSeek/Gemini/etc.
            const improved = await aiService.completion([{ role: 'user', content: prompt }]);
            return improved;
        } catch (err) {
            console.error('AI improvement failed', err);
            return null;
        }
    }
};
