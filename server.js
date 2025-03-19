require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const { google } = require('googleapis');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Google OAuth2 Client Setup
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);

// Set the Refresh Token
oauth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

async function sendEmail(to, message) {
  try {
    // ✅ Get a new Access Token dynamically (DO NOT HARDCODE IT)
    const accessToken = await oauth2Client.getAccessToken();

    // ✅ Setup Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken: accessToken.token, // Use the dynamically fetched access token
      },
    });

    // ✅ Setup email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: "Message from Your App",
      text: message,
    };

    // ✅ Send the email
    await transporter.sendMail(mailOptions);
    return { success: true, message: "Message sent successfully." };
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return { success: false, message: "Failed to send email.", error };
  }
}

// ✅ API Route to Send Email
app.post('/send-message', async (req, res) => {
  const { email, message } = req.body;

  if (!email || !message) {
    return res.status(400).json({ success: false, message: 'Email and message are required.' });
  }

  const response = await sendEmail(email, message);
  res.status(response.success ? 200 : 500).json(response);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
