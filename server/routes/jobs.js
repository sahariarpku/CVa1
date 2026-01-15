const express = require('express');
const router = express.Router();
const chromium = require('puppeteer'); // Use standard puppeteer
const puppeteer = require('puppeteer');
const { db } = require('../utils/firebaseAdmin');

// SEARCH jobs from jobs.ac.uk (Puppeteer Scraper)
router.get('/search', async (req, res) => {
    console.log("Job Search Route Hit [V3 - Puppeteer Docker]");
    const { q } = req.query;
    const keyword = q || 'research';
    const url = `https://www.jobs.ac.uk/search/?keywords=${encodeURIComponent(keyword)}`;

    let browser = null;

    try {
        console.log("Launching browser...");

        // Launch standard Puppeteer (Docker/Local)
        browser = await puppeteer.launch({
            headless: "new",
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage', // Required for Docker
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();

        // Mimic Real Browser
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        console.log(`Navigating to ${url}...`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Scrape Data from DOM
        const jobs = await page.evaluate(() => {
            const results = [];
            const items = document.querySelectorAll('.j-search-result__result');

            items.forEach((el, i) => {
                const titleEl = el.querySelector('.j-search-result__text a');
                if (!titleEl) return;

                const title = titleEl.textContent.trim();
                const relativeLink = titleEl.getAttribute('href');
                const link = relativeLink ? `https://www.jobs.ac.uk${relativeLink}` : '';

                const employerEl = el.querySelector('.j-search-result__employer');
                const employer = employerEl ? employerEl.textContent.trim() : '';

                const locationEl = el.querySelector('.j-search-result__department');
                const location = locationEl ? locationEl.textContent.trim() : '';

                let salary = 'Competitive';
                const infoEl = el.querySelector('.j-search-result__info');
                if (infoEl) {
                    const text = infoEl.textContent;
                    const salaryMatch = text.match(/Salary:\s*(.+)/i);
                    if (salaryMatch) {
                        salary = salaryMatch[1].trim().replace(/\s+/g, ' ');
                    }
                }

                const dateEl = el.querySelector('.j-search-result__date--blue');
                const closingDate = dateEl ? dateEl.textContent.trim() : '';

                // Extract ID
                const datasetId = el.getAttribute('data-advert-id');
                const id = datasetId || (relativeLink ? relativeLink.split('/')[2] : `job-${i}`);

                // Logo
                const logoImg = el.querySelector('.j-search-result__small-logo img');
                let logo = null;
                if (logoImg) {
                    const src = logoImg.getAttribute('src');
                    logo = src ? (src.startsWith('http') ? src : `https://www.jobs.ac.uk${src}`) : null;
                }

                results.push({
                    id: id ? id.toString() : `job-${i}`,
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
            });
            return results;
        });

        console.log(`Scraped ${jobs.length} jobs via Puppeteer`);
        res.json({ jobs });

    } catch (error) {
        console.error('Puppeteer Scraping Error:', error);
        res.status(500).json({ error: 'Failed to fetch jobs', details: error.message });
    } finally {
        if (browser) {
            await browser.close();
        }
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
