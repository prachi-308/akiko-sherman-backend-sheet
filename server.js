const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({ origin: 'https://your-username.github.io' })); // Replace with your GitHub Pages URL

// Google Sheets Setup
let credentials;
try {
    credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS); // Load credentials from environment variable
} catch (error) {
    console.error('Failed to parse GOOGLE_CREDENTIALS:', error);
    throw new Error('Invalid GOOGLE_CREDENTIALS environment variable');
}

const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets({ version: 'v4', auth });

// Function to Append Data to Google Sheet
async function appendToSheet(data) {
    console.log('Attempting to append data to Sheet:', data);
    console.log('Spreadsheet ID:', process.env.SPREADSHEET_ID);
    
    const { name, phone, email, company, message } = data;
    const spreadsheetId = process.env.SPREADSHEET_ID;
    if (!spreadsheetId) {
        throw new Error('SPREADSHEET_ID environment variable is not set');
    }
    
    const range = 'Sheet1!A:E';
    const values = [
        [name, phone, email, company, message]
    ];

    try {
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption: 'RAW',
            resource: { values }
        });
        console.log('Data successfully appended to Sheet:', response.data);
        return true;
    } catch (error) {
        console.error('Error appending to Sheet:', error.message);
        throw error; // Re-throw the error to be caught by the route handler
    }
}

// Form Submission Route
app.post('/submit', async (req, res) => {
    console.log('Received form submission:', req.body);
    const { name, phone, email, company, message } = req.body;

    // Validate that all fields are provided
    if (!name || !phone || !email || !company || !message) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    try {
        await appendToSheet(req.body); // Wait for the operation to complete
        res.json({ success: true, message: 'Form submitted successfully' });
    } catch (error) {
        console.error('Failed to append to Sheet:', error);
        res.status(500).json({ success: false, message: 'Failed to save form data' });
    }
});

// Start Server
const PORT = process.env.PORT || 5000; // Use Render's dynamic port
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
