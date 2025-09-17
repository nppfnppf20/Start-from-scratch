const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();

// Serve static files from the office-addon directory
app.use(express.static(__dirname));

// Serve the add-in files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'taskpane.html'));
});

// Create self-signed certificate for HTTPS
const options = {
    key: fs.readFileSync(path.join(__dirname, 'localhost-key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'localhost.pem'))
};

const PORT = 3000;

https.createServer(options, app).listen(PORT, () => {
    console.log(`Office Add-in server running on https://localhost:${PORT}`);
    console.log(`Manifest URL: https://localhost:${PORT}/manifest.xml`);
});
