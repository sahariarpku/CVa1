import { CVProfile, Job } from '../types';

export const matchingService = {
    calculateMatchScore(profile: CVProfile, job: Job): number {
        if (!profile || !job) return 0;

        let score = 0;
        const maxScore = 100;

        // 1. Tokenize Job Title & Employer
        const jobTokens = new Set([
            ...this.tokenize(job.title),
            ...this.tokenize(job.employer)
        ]);

        // 2. Extract Profile Tokens
        const skillsTokens = new Set(profile.skills.flatMap(s => this.tokenize(s)));
        const expTokens = new Set(profile.experience.flatMap(e => this.tokenize(e.role)));
        const summaryTokens = new Set(this.tokenize(profile.personal.summary || ''));

        // 3. Scoring Weights
        let matchCount = 0;

        // A. Title vs Skills (Crucial) -> Highly weighted
        jobTokens.forEach(token => {
            if (skillsTokens.has(token)) {
                matchCount += 15; // High value for skill matching job title (e.g. "React" dev)
            }
        });

        // B. Title vs Experience Roles (History)
        jobTokens.forEach(token => {
            if (expTokens.has(token)) {
                matchCount += 10; // Good value if you've done it before
            }
        });

        // C. Title vs Summary (Intent)
        jobTokens.forEach(token => {
            if (summaryTokens.has(token)) {
                matchCount += 5;
            }
        });

        // D. Penalties / Adjustments
        // If job is "Senior" and profile has < 2 years exp? (Hard to know exact years, ignoring for now)

        // E. Base Score
        // Ensure "Research" jobs match "Research" profiles
        if (job.title.toLowerCase().includes('research') &&
            (profile.personal.summary?.toLowerCase().includes('research') || profile.education.length > 0)) {
            matchCount += 20;
        }

        // F. Academic Specifics
        if (job.title.toLowerCase().includes('phd') && profile.education.some(e => e.degree.toLowerCase().includes('phd') || e.degree.toLowerCase().includes('doctorate'))) {
            matchCount += 25;
        }

        // Normalize
        // Random jitter to make it look "organic" and not just 0 or 100
        // But mostly deterministic
        score = Math.min(matchCount + 10, 95); // Base 10 points

        // Safety clamp
        return Math.max(10, Math.min(score, 99));
    },

    tokenize(text: string): string[] {
        if (!text) return [];
        return text
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '') // remove punctuation
            .split(/\s+/)
            .filter(w => w.length > 2) // ignore "a", "of", "in"
            .filter(w => !['the', 'and', 'for', 'with', 'part', 'time', 'full'].includes(w));
    }
};
