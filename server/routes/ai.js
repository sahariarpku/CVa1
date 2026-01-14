const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');
const { Anthropic } = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// POST /api/ai/completion
router.post('/completion', async (req, res) => {
    const { provider, apiKey, baseUrl, model, messages, jsonMode } = req.body;
    console.log('[AI Proxy] Request:', { provider, model, baseUrl: baseUrl ? 'SET' : 'NONE' });

    if (!apiKey) {
        return res.status(400).json({ error: 'API Key is required' });
    }

    try {
        let result = '';

        if (provider === 'openai' || provider === 'groq' || provider === 'deepseek') {
            const config = { apiKey };
            if (baseUrl) config.baseURL = baseUrl;

            const openai = new OpenAI(config);
            const completion = await openai.chat.completions.create({
                model: model || (provider === 'groq' ? 'llama3-70b-8192' : 'gpt-4o'),
                messages,
                response_format: jsonMode ? { type: "json_object" } : undefined
            });
            result = completion.choices[0].message.content;

        } else if (provider === 'claude') {
            const anthropic = new Anthropic({ apiKey });
            // Anthropic expects system message separately or as first "system" role, 
            // but the SDK handles messages array differently.
            // Simplified for now: just passing user messages.
            const completion = await anthropic.messages.create({
                model: model || "claude-3-5-sonnet-20240620",
                max_tokens: 4096,
                messages: messages.filter(m => m.role !== 'system') // Anthropic handles system prompt via top-level param ideally
            });
            result = completion.content[0].text;

        } else if (provider === 'gemini') {
            const genAI = new GoogleGenerativeAI(apiKey);
            const genModel = genAI.getGenerativeModel({ model: model || "gemini-1.5-flash" });

            // Convert messages to Gemini format if needed, or just prompt
            // Simplest: Combine last user message
            const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');
            const resultGen = await genModel.generateContent(prompt);
            const response = await resultGen.response;
            result = response.text();
        } else {
            return res.status(400).json({ error: 'Unsupported provider' });
        }

        res.json({ success: true, text: result });

    } catch (error) {
        console.error('AI Proxy Error:', error);
        res.status(500).json({ error: error.message || 'AI Provider Error' });
    }
});

module.exports = router;
