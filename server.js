// ═══════════════════════════════════════════════════════════════
//  server.js  –  Portfolio Contact Form Backend
//  Stack: Node.js + Express + Nodemailer (Gmail SMTP)
// ═══════════════════════════════════════════════════════════════

require('dotenv').config();          // loads .env file
const express    = require('express');
const nodemailer = require('nodemailer');
const cors       = require('cors');
const path       = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors({ origin: '*' }));          // allow requests from browser (file:// or localhost)
app.use(express.json());             // parse JSON request bodies
app.use(express.static(path.join(__dirname)));  // serve HTML/CSS/JS files

// ── Nodemailer transporter (Gmail SMTP) ───────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,   // your Gmail from .env
    pass: process.env.GMAIL_PASS,   // your App Password from .env
  },
});

// ── Verify Gmail connection on startup ────────────────────────
transporter.verify((error, success) => {
  if (error) {
    console.error('❌  Gmail connection FAILED:', error.message);
    console.error('    Check GMAIL_USER and GMAIL_PASS env variables!');
  } else {
    console.log('✅  Gmail connection verified — ready to send emails!');
  }
});

// ── POST /send-email  (the form hits this route) ──────────────
app.post('/send-email', async (req, res) => {
  const { name, email, subject, message } = req.body;

  // ── Basic server-side validation ──────────────────────────
  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      error: 'Name, email, and message are required.',
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid email address.',
    });
  }

  // ── Build the email ────────────────────────────────────────
  const mailOptions = {
    from:     `"Portfolio Contact" <${process.env.GMAIL_USER}>`,  // avoids spam
    to:       process.env.GMAIL_USER,                             // your inbox
    replyTo:  `"${name}" <${email}>`,                            // reply goes to sender
    subject:  `[Portfolio] ${subject || 'New message from ' + name}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;
                  background:#f9f9f9;border-radius:8px;border:1px solid #e0e0e0;">
        <h2 style="color:#00f5c4;margin-bottom:4px;">New Portfolio Message</h2>
        <hr style="border:none;border-top:1px solid #ddd;margin:12px 0;">

        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        <p><strong>Subject:</strong> ${subject || '—'}</p>

        <hr style="border:none;border-top:1px solid #ddd;margin:12px 0;">
        <p><strong>Message:</strong></p>
        <p style="white-space:pre-line;color:#333;">${message}</p>

        <hr style="border:none;border-top:1px solid #ddd;margin:12px 0;">
        <p style="font-size:12px;color:#999;">
          Sent via your portfolio contact form at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
        </p>
      </div>
    `,
  };

  // ── Send the email ─────────────────────────────────────────
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅  Email sent from ${name} <${email}>`);
    res.json({ success: true, message: 'Email sent successfully!' });
  } catch (err) {
    console.error('❌  Email error:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to send email. Check server logs.',
    });
  }
});

// ── Serve index.html for all non-API routes ───────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Start server ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀  Portfolio server running at http://localhost:${PORT}`);
  console.log(`📬  Contact form → POST http://localhost:${PORT}/send-email\n`);
});
