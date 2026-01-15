const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');
const { db } = require('../utils/firebaseAdmin');

// SEARCH jobs from jobs.ac.uk (Basic Scraper)
router.get('/search', async (req, res) => {
    console.log("Job Search Route Hit [V2]");
    const { q } = req.query;
    const keyword = q || 'research';
    const url = `https://www.jobs.ac.uk/search/?keywords=${encodeURIComponent(keyword)}`;

    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Referer': 'https://www.jobs.ac.uk/',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-User': '?1'
            }
        });

        const $ = cheerio.load(data);

        const jobs = [];

        $('.j-search-result__result').each((i, el) => {
            const titleEl = $(el).find('.j-search-result__text a').first();
            const title = titleEl.text().trim();
            const relativeLink = titleEl.attr('href');
            const link = relativeLink ? `https://www.jobs.ac.uk${relativeLink}` : '';

            const employer = $(el).find('.j-search-result__employer').text().trim();
            const location = $(el).find('.j-search-result__department').text().trim();

            let salary = $(el).find('.j-search-result__info').text().replace(/Salary:\s*/i, '').trim();
            salary = salary.replace(/\s+/g, ' ');

            const closingDate = $(el).find('.j-search-result__date--blue').text().trim();

            // Extract ID
            const id = $(el).data('advert-id') || (relativeLink ? relativeLink.split('/')[2] : `job-${i}`);

            // Logo
            const logoRel = $(el).find('.j-search-result__small-logo img').attr('src');
            const logo = logoRel ? (logoRel.startsWith('http') ? logoRel : `https://www.jobs.ac.uk${logoRel}`) : null;

            if (title) {
                jobs.push({
                    id: id.toString(),
                    title,
                    employer,
                    location,
                    salary,
                    deadline: closingDate,
                    link,
                    imageUrl: logo,
                    source: 'jobs.ac.uk',
                    matchScore: Math.floor(Math.random() * 15) + 85
                });
            }
        });

        console.log(`Scraped ${jobs.length} jobs for query: ${keyword}`);
        res.json({ jobs });
    } catch (error) {
        console.error('Scraping error:', error.message);
        if (error.response) {
            console.error('Upstream Status:', error.response.status);
            console.error('Upstream Data:', error.response.data);
            return res.status(error.response.status).json({
                error: `Upstream error: ${error.response.status}`,
                details: error.message
            });
        }
        res.status(500).json({ error: 'Failed to fetch jobs', details: error.message });
    }
});

// SAVE a job (Swipe Right)
router.post('/save', async (req, res) => {
    const { job } = req.body;

    if (!job) {
        return res.status(400).json({ error: 'No job data provided' });
    }

    try {
        // Save to Firebase Firestore
        const docRef = await db.collection('saved_jobs').add({
            job_id: job.id,
            title: job.title,
            employer: job.employer || job.institution,
            location: job.location || 'Remote',
            salary: job.salary,
            deadline: job.deadline,
            link: job.link,
            imageUrl: job.imageUrl,
            status: 'Saved',
            raw_data: job,
            created_at: new Date().toISOString()
        });

        console.log(`Job saved to Firestore: ${job.title} (ID: ${docRef.id})`);
        res.json({ success: true, message: 'Job saved successfully', id: docRef.id });
    } catch (error) {
        console.error('Firebase error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
