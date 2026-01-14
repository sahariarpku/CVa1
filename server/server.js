const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const jobsRoutes = require('./routes/jobs');
const applicationsRoutes = require('./routes/applications');
const settingsRoutes = require('./routes/settings');
const cvRoutes = require('./routes/cv');

app.use('/api/jobs', jobsRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/cv', cvRoutes);
app.use('/api/ai', require('./routes/ai')); // AI Proxy

app.get('/', (req, res) => {
  res.send('Job Swipe API is running');
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
