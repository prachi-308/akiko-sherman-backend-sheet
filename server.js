const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
require('dotenv').config();
const credentials = require('./credentials.json');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({ origin: '*' }));

// Google Sheets Setup
const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets({ version: 'v4', auth });

// Function to Append Data to Google Sheet (Background Task)
async function appendToSheet(data) {
    console.log('Attempting to append data to Sheet:', data);
    console.log('Spreadsheet ID:', process.env.SPREADSHEET_ID);
    const { name, phone, email, company, message } = data;
    const spreadsheetId = process.env.SPREADSHEET_ID;
    const range = 'Sheet1!A:E';

    const values = [
        [name, phone, email, company, message]
    ];

    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption: 'RAW',
            resource: { values }
        });
        console.log('Data successfully appended to Sheet');
    } catch (error) {
        console.error('Error appending to Sheet:', error);
        // Log the error but don't throw it since this is a background task
    }
}

// Form Submission Route
app.post('/submit', async(req, res) => {
    console.log('Received form submission:', req.body);
    const { name, phone, email, company, message } = req.body;

    // Validate that all fields are provided
    if (!name || !phone || !email || !company || !message) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Fire-and-forget: Trigger the Google Sheets append operation in the background
    appendToSheet(req.body).catch(err => {
        console.error('Background task failed:', err);
    });

    // Respond immediately to the client
    res.json({ success: true, message: 'Form submitted successfully' });
});

// Start Server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
