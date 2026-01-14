const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const pdf = require('pdf-parse');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const supabase = require('../utils/db');

// File Upload Config
const upload = multer({ dest: 'uploads/' });

// Gemini Config
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'MISSING_KEY');

// GET User Profile (Mock User ID or Query Param)
router.get('/', async (req, res) => {
    const { user_id } = req.query; // Expect client to send user_id, or use mock
    const uid = user_id || 'mock-user-123';

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', uid)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" which is fine
        console.error('Supabase fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch profile' });
    }

    // If no profile, return empty structure or null
    res.json({ profile: data || null });
});

// SAVE User Profile
router.post('/save', async (req, res) => {
    const { user_id, profile } = req.body;
    const uid = user_id || 'mock-user-123';

    if (!profile) {
        return res.status(400).json({ error: 'No profile data provided' });
    }

    const { data, error } = await supabase
        .from('profiles')
        .upsert([{
            user_id: uid,
            full_name: profile.personal?.fullName,
            email: profile.personal?.email,
            raw_data: profile, // Store the full JSON blob for flexibility
            updated_at: new Date()
        }], { onConflict: 'user_id' });

    if (error) {
        console.error('Supabase save error:', error);
        return res.status(500).json({ error: 'Failed to save profile' });
    }

    res.json({ success: true, message: 'Profile saved successfully' });
});

// PARSE CV (PDF/Text)
router.post('/parse', upload.single('cv'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const filePath = req.file.path;
        let dataBuffer = fs.readFileSync(filePath);
        let textContent = '';

        // Basic PDF Parsing
        if (req.file.mimetype === 'application/pdf') {
            const pdfData = await pdf(dataBuffer);
            textContent = pdfData.text;
        } else {
            // Assume text/plain or similar simple formats
            textContent = dataBuffer.toString();
        }

        // Clean up file
        fs.unlinkSync(filePath);

        // Call Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
        You are an expert Resume Parser. 
        Extract the following information from the text below and return ONLY valid JSON.
        Do not include markdown formatting like \`\`\`json.
        
        Structure:
        {
          "personal": { "fullName": "", "email": "", "phone": "", "linkedin": "", "address": "" },
          "education": [ { "institution": "", "degree": "", "year": "" } ],
          "experience": [ { "role": "", "company": "", "duration": "", "description": "" } ],
          "skills": [],
          "projects": [],
          "publications": []
        }

        Resume Text:
        ${textContent.substring(0, 30000)} // Limit context
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        // Clean markdown code blocks if present
        const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();

        const parsedData = JSON.parse(text);

        res.json({ success: true, data: parsedData });

    } catch (error) {
        console.error('Parsing error details:', error);
        res.status(500).json({ error: 'Failed to parse CV', details: error.message });
    }
});

// IMPROVE TEXT (AI)
router.post('/improve', async (req, res) => {
    const { text, type } = req.body;
    if (!text) return res.status(400).json({ error: 'No text provided' });

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
        You are a generic professional resume editor.
        Improve the following ${type || 'text'} for a CV to make it more professional, impactful, and concise.
        Maintain the original meaning but improve vocabulary and flow.
        Return ONLY the improved text, no explanations.

        Original Text:
        "${text}"
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const improved = response.text().trim();

        res.json({ success: true, text: improved });
    } catch (error) {
        console.error('Improvement error:', error);
        res.status(500).json({ error: 'Failed to improve text' });
    }
});

module.exports = router;
