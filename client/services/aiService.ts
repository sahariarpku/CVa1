import { Job, CVProfile } from '../types';

export type AIProvider = 'openai' | 'claude' | 'groq' | 'gemini' | 'deepseek';

interface AIConfig {
    provider: AIProvider;
    apiKey: string;
    baseUrl?: string;
    model?: string;
}

const DEFAULT_MODELS = {
    openai: 'gpt-4o',
    claude: 'claude-3-5-sonnet-20240620',
    groq: 'llama3-70b-8192',
    gemini: 'gemini-1.5-flash',
    deepseek: 'deepseek-chat'
};

const DEFAULT_BASE_URLS = {
    openai: 'https://api.openai.com/v1',
    claude: 'https://api.anthropic.com/v1',
    groq: 'https://api.groq.com/openai/v1',
    gemini: '', // handled by SDK
    deepseek: 'https://api.deepseek.com/v1'
};

export const aiService = {
    // In-memory config for runtime
    _config: null as AIConfig | null,

    setConfig(config: AIConfig) {
        this._config = config;
    },

    getConfig(): AIConfig | null {
        return this._config;
    },

    // Deprecated: Only used during migration or as fallback
    saveConfig(config: AIConfig) {
        this._config = config;
        localStorage.setItem('ai_config', JSON.stringify(config));
    },

    async completion(messages: any[], jsonMode = false, signal?: AbortSignal): Promise<string> {
        let config = this.getConfig();

        // Fallback to localStorage if not set in memory (e.g. strict reload)
        if (!config) {
            const stored = localStorage.getItem('ai_config');
            if (stored) config = JSON.parse(stored);
        }

        if (!config || !config.apiKey) {
            throw new Error("AI Provider not configured. Please go to Settings.");
        }

        // Self-Correction: Ensure provider matches model (fixes "GoogleGenerativeAI Error")
        if (config.model && config.model.toLowerCase().includes('deepseek') && config.provider !== 'deepseek') {
            console.warn(`[AIService] Mismatch detected! Provider is ${config.provider} but model is ${config.model}. Auto-correcting to 'deepseek'.`);
            config.provider = 'deepseek';
            // Ensure Base URL is also correct if not set
            if (!config.baseUrl) config.baseUrl = DEFAULT_BASE_URLS.deepseek;
        }

        console.log("[AIService] Calling completion with config:", config);

        const res = await fetch('/api/ai/completion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...config,
                model: config.model || DEFAULT_MODELS[config.provider],
                baseUrl: config.baseUrl || DEFAULT_BASE_URLS[config.provider],
                messages,
                jsonMode
            }),
            signal // Pass the signal here
        });

        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        return data.text;
    },

    async calculateJobMatch(job: Job, profile: CVProfile, signal?: AbortSignal): Promise<{ score: number; reason: string; missing_skills?: string[] }> {
        try {
            const educationText = profile.education.map(e => `${e.degree} in ${e.fieldOfStudy} at ${e.institution} (${e.endDate})`).join('; ');
            const expText = profile.experience.map(e => `Role: ${e.role} at ${e.company} (${e.duration}). Details: ${e.description}`).join('\n');
            const pubsText = profile.publications.map(p => `${p.title} (${p.venue}, ${p.date})`).join('; ');

            const prompt = `
            You are a strict and honest Academic Recruiter. Your task is to critically evaluate the match between a candidate's CV and a Job Description.

            JOB DETAILS:
            Title: ${job.title}
            Employer: ${job.employer || job.institution}
            Description: ${JSON.stringify(job)}

            CANDIDATE CV:
            Summary: ${profile.personal.summary}
            Skills: ${profile.skills.join(', ')}
            Education: ${educationText}
            Experience: ${expText}
            Publications: ${pubsText}
            Awards: ${profile.awards.map(a => a.title).join(', ')}

            INSTRUCTIONS:
            1. Analyze the overlap in Research Interests, Technical Skills, and Education Level.
            2. Be critical. If the job requires a PhD and the candidate has a BSc, penalize heavily.
            3. If the research area (e.g., "Machine Learning") matches but the specific niche (e.g., "Reinforcement Learning") is missing, note it.
            
            OUTPUT FORMAT (JSON ONLY):
            {
                "score": <number 0-100>,
                "reason": "<One concise sentence limiting to 20 words explaining the score. Be direct.>",
                "missing_skills": ["<skill1>", "<skill2>"]
            }
            `;

            const text = await this.completion([{ role: 'user', content: prompt }], true, signal);
            const result = JSON.parse(text);
            return result;
        } catch (e: any) {
            if (e.name === 'AbortError') throw e; // Propagate abort
            console.error("AI Match Error", e);
            return { score: 0, reason: "Failed to calculate match.", missing_skills: [] };
        }
    },

    async tailorCV(job: Job, profile: CVProfile): Promise<string> {
        const prompt = `
        Rewrite the following CV Professional Summary to specifically target this job.
        Keep it professional, academic, and highlight relevant skills.

        JOB TITLE: ${job.title}
        EMPLOYER: ${job.employer || job.institution}

        CURRENT SUMMARY:
        ${profile.personal.summary}

        SKILLS:
        ${profile.skills.join(', ')}

        Return only the rewritten summary text.
        `;
        return this.completion([{ role: 'user', content: prompt }]);
    },

    async writeCoverLetter(job: Job, profile: CVProfile): Promise<string> {
        const prompt = `
        Write a compelling academic cover letter for:
        Role: ${job.title}
        Institution: ${job.employer || job.institution}

        My Background:
        ${profile.personal.summary}
        Top Skills: ${profile.skills.slice(0, 5).join(', ')}
        Recent Role: ${profile.experience[0]?.role || 'Researcher'} at ${profile.experience[0]?.company || 'University'}

        Keep it concise (max 300 words), professional, and persuasive. Format with standard placeholders [Address], [Date] if needed.
        `;
        return this.completion([{ role: 'user', content: prompt }]);
    }
};
