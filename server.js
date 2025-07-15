// server.js

// Load environment variables from .env file
// This line should be at the very top of your file
require('dotenv').config();

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
// Use the PORT environment variable provided by Render, or default to 3000 for local development
const port = process.env.PORT || 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// Configure CORS
// In development, we allow all origins (*).
// In production, for better security, you should replace '*' with your frontend's domain (e.g., 'https://star2knb.github.io').
app.use(cors({
    origin: '*',
    methods: ['POST', 'GET'], // Allow POST and GET requests
    allowedHeaders: ['Content-Type', 'Authorization'] // Allow these headers
}));

// Configure Nodemailer transporter
// This object holds the configuration for sending emails.
// Replace with your actual email service details (e.g., Gmail, Outlook, SendGrid SMTP).
// The credentials (user/pass) will come from environment variables.
const transporter = nodemailer.createTransport({
    service: 'gmail', // Example: 'gmail'. You can also use 'smtp.mailgun.org', 'smtp.sendgrid.net', etc.
    auth: {
        user: process.env.EMAIL_USER, // Your sending email address (from .env)
        pass: process.env.EMAIL_PASS  // Your email password or app-specific password (from .env)
    }
});

// API endpoint to receive geolocation data and send email
// This endpoint will receive POST requests from your frontend.
app.post('/send-geolocation-email', async (req, res) => {
    // Extract latitude, longitude, and timestamp from the request body
    const { latitude, longitude, timestamp } = req.body;

    // Basic validation: Check if latitude and longitude are provided
    if (latitude == null || longitude == null) {
        console.error('Missing latitude or longitude in request body.');
        return res.status(400).json({ message: 'Latitude and longitude are required.' });
    }

    // The email address where you want to receive the geolocation data
    const recipientEmail = process.env.RECIPIENT_EMAIL; // From .env

    // Construct the email content
    const mailOptions = {
        from: process.env.EMAIL_USER, // Sender address (must match the user configured in transporter)
        to: recipientEmail,
        subject: `Geolocation Update from Website - ${new Date().toLocaleString()}`, // Email subject
        html: `
            <p>Hello,</p>
            <p>Here are the latest geolocation coordinates:</p>
            <ul>
                <li><strong>Latitude:</strong> ${latitude}</li>
                <li><strong>Longitude:</strong> ${longitude}</li>
                <li><strong>Timestamp:</strong> ${timestamp}</li>
            </ul>
            <p>You can view this location on Google Maps: <a href="https://www.google.com/maps?q=${latitude},${longitude}">Click Here</a></p>
            <p>Best regards,<br>Your Geolocation App</p>
        `
    };

    try {
        // Send the email using Nodemailer
        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${recipientEmail} with coordinates: ${latitude}, ${longitude}`);
        // Send a success response back to the frontend
        res.status(200).json({ message: 'Email sent successfully!' });
    } catch (error) {
        console.error('Error sending email:', error);
        // Send an error response back to the frontend
        res.status(500).json({ message: 'Failed to send email.', error: error.message });
    }
});

// Start the server and listen for incoming requests
app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
    console.log(`API endpoint: http://localhost:${port}/send-geolocation-email`);
});
