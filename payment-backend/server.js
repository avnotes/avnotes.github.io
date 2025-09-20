// AV Notes Razorpay Payment Backend (Node.js)
// No coding required for you—just deploy on Render.com!

const express = require('express');
const Razorpay = require('razorpay');
const bodyParser = require('body-parser');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

// Razorpay credentials from environment variables (.env file)
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create a new payment order
app.post('/api/create-order', async (req, res) => {
    try {
        const { amount } = req.body; // Amount in paise, e.g. 39900 for ₹399
        const options = {
            amount: amount,
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
        };
        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Verify payment signature (optional security step)
app.post('/api/verify-payment', (req, res) => {
    const { order_id, payment_id, signature } = req.body;
    const generated_signature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(order_id + "|" + payment_id)
        .digest('hex');
    if (generated_signature === signature) {
        res.json({ status: 'success' });
    } else {
        res.status(400).json({ status: 'failure' });
    }
});

// Razorpay webhook endpoint (for payment notifications)
app.post('/api/razorpay-webhook', (req, res) => {
    // Setup your webhook secret in Razorpay dashboard and .env file
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const shasum = crypto.createHmac('sha256', secret)
        .update(JSON.stringify(req.body))
        .digest('hex');
    if (shasum === req.headers['x-razorpay-signature']) {
        console.log('Webhook verified:', req.body.event);
        // Here, you can store payment status, send email, fulfill order, etc.
        res.status(200).send('OK');
    } else {
        res.status(400).send('Invalid signature');
    }
});

app.get('/', (req, res) => {
    res.send('AV Notes Payment Backend is running!');
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Backend running on port ${port}`));
