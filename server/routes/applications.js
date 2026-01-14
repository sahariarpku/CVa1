const express = require('express');
const router = express.Router();
const { db } = require('../utils/firebaseAdmin');

// GET all applied/saved jobs
router.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection('saved_jobs')
            .orderBy('created_at', 'desc')
            .get();

        const jobs = [];
        snapshot.forEach(doc => {
            jobs.push({
                id: doc.id,
                ...doc.data()
            });
        });

        console.log(`Fetched ${jobs.length} saved jobs from Firestore`);
        res.json({ jobs });
    } catch (error) {
        console.error('Firestore fetch error:', error);
        // Return empty array on error instead of mock data
        res.json({ jobs: [] });
    }
});

// MARK AS APPLIED
router.post('/mark-applied', async (req, res) => {
    const { id } = req.body;

    if (!id) return res.status(400).json({ error: 'Missing Job ID' });

    try {
        await db.collection('saved_jobs').doc(id).update({
            status: 'Submitted',
            date_applied: new Date().toISOString()
        });

        console.log(`Job ${id} marked as applied`);
        res.json({ success: true });
    } catch (error) {
        console.error('Firestore update error:', error);
        res.status(500).json({ error: 'Failed to update' });
    }
});

module.exports = router;
