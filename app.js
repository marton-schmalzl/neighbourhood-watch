require('dotenv').config(); // Import and configure dotenv
const express = require('express');
const multer = require('multer');
const sgMail = require('@sendgrid/mail');
const fs = require('fs');
const path = require('path');

// SendGrid API key from .env
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public'))); // Serve static files like HTML, CSS, etc.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({ dest: 'uploads/' });

app.post('/report', upload.single('image'), (req, res) => {
  const { name, email, phone, description } = req.body;
  const image = req.file;

  // Construct email message
  const msg = {
    to: process.env.TO_EMAIL, // Send to predefined recipient
    from: process.env.FROM_EMAIL, // From email (set in .env)
    subject: 'Új esemény jelentés',
    text: `Név: ${name}\nEmail: ${email}\nTelefonszám: ${phone}\nEsemény leírása: ${description}`,
    cc: email, // CC reporter
  };

  if (image) {
    msg.attachments = [
      {
        content: fs.readFileSync(image.path).toString('base64'),
        filename: image.originalname,
        type: image.mimetype,
        disposition: 'attachment',
      },
    ];
  }

  // Send the email using SendGrid
  sgMail.send(msg)
    .then(() => {
      res.send(`
        <html lang="hu">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Jelentés sikeresen elküldve</title>
          <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: 'Poppins', sans-serif;
              background-color: #f7f9fc;
              color: #333;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
            }
            .message-container {
              background-color: #ffffff;
              padding: 20px 30px;
              border-radius: 10px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
              max-width: 600px;
              text-align: center;
            }
            h1 {
              font-size: 24px;
              font-weight: 600;
              color: #1d3557;
              margin-bottom: 15px;
            }
            p {
              font-size: 16px;
              color: #333;
              margin-bottom: 20px;
            }
            a {
              text-decoration: none;
              color: #457b9d;
              font-weight: 600;
              padding: 10px 20px;
              border: 2px solid #457b9d;
              border-radius: 8px;
              transition: all 0.3s ease;
            }
            a:hover {
              background-color: #457b9d;
              color: white;
            }
          </style>
        </head>
        <body>
          <div class="message-container">
            <h1>Köszönjük a jelentést!</h1>
            <p>A jelentésedet sikeresen elküldtük. Másolatot kaptál az e-mail címedre.</p>
            <a href="/">Vissza a kezdőlapra</a>
          </div>
        </body>
        </html>
      `);
    })
    .catch((error) => {
      console.error('SendGrid Error:', error.response.body.errors);
      res.status(500).send('Hiba történt a jelentés elküldése során.');
    });
});

// Serve the HTML form
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
