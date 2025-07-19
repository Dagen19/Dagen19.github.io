// server.js

// --- 1. Import Required Libraries ---
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const nodemailer = require('nodemailer'); // For sending emails
require('dotenv').config(); 

// --- 2. Initialize the Server ---
const app = express();
const PORT = 3000;

// --- 3. Configure Middleware ---
app.use(cors());
app.use(express.json());

// --- 4. Define API Endpoints ---

// Endpoint for the AI Chatbot
app.post('/api/chat', async (req, res) => {
    try {
        const { chatHistory } = req.body;
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            throw new Error("API Key not found.");
        }
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
        const payload = { contents: chatHistory };
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorData = await response.json();
            console.error("API Error:", errorData);
            return res.status(response.status).json({ message: "Error from Gemini API", details: errorData });
        }
        const result = await response.json();
        res.json(result);
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// *** UPDATED ENDPOINT FOR SENDING EMAILS ***
app.post('/api/send-email', async (req, res) => {
    try {
        // Now we also receive senderType from the form
        const { name, email, company, message, type, senderType } = req.body;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS 
            }
        });

        // *** NEW: Logic to format the "From" field based on senderType ***
        let fromLabel = "From (Individual)";
        if (senderType === 'Organization') {
            fromLabel = "From (Organization)";
        }

        const mailOptions = {
            from: `"${name}" <${email}>`, 
            to: process.env.EMAIL_USER, 
            subject: `New Portfolio Message: ${type}`, 
            html: `
                <h2>New ${type} from your Portfolio Website</h2>
                <p><strong>${fromLabel}:</strong> ${name}</p>
                <p><strong>Contact Email:</strong> ${email}</p>
                ${company ? `<p><strong>Company:</strong> ${company}</p>` : ''}
                <hr>
                <h3>Message:</h3>
                <p>${message}</p>
            `
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Email sent successfully!' });

    } catch (error) {
        console.error("Email Sending Error:", error);
        res.status(500).json({ message: 'Failed to send email.' });
    }
});


// --- 5. Start the Server ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
