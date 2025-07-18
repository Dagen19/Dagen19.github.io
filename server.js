// server.js

// --- 1. Import Required Libraries ---
// We need 'express' to create our web server.
// We need 'cors' to allow our frontend website to talk to this server.
// We need 'node-fetch' to make API calls from our server to the Google AI server.
// We need 'dotenv' to securely manage our API key.
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config(); // This loads the .env file

// --- 2. Initialize the Server ---
const app = express();
const PORT = 3000; // The server will run on port 3000

// --- 3. Configure Middleware ---
// This tells our server to enable CORS (so the browser doesn't block requests).
app.use(cors());
// This tells our server to understand JSON data sent from the frontend.
app.use(express.json());

// --- 4. Define the API Endpoint ---
// We create an endpoint at '/api/chat'. When our website sends a message here, this code will run.
app.post('/api/chat', async (req, res) => {
    try {
        // Get the conversation history sent from the frontend
        const { chatHistory } = req.body;

        // Get the API Key from our secure environment variables
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            throw new Error("API Key not found.");
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
        
        const payload = { contents: chatHistory };

        // Make the secure call from our server to the Google AI API
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            // If Google's server returns an error, we send it back to our frontend
            const errorData = await response.json();
            console.error("API Error:", errorData);
            return res.status(response.status).json({ message: "Error from Gemini API", details: errorData });
        }

        const result = await response.json();
        
        // Send the AI's response back to our frontend
        res.json(result);

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// --- 5. Start the Server ---
// This command starts the server and makes it listen for requests on the specified port.
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
