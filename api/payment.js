import fetch from 'node-fetch';

const ESCROW_AUTH = 'Basic ' + Buffer.from(`${process.env.ESCROW_API_USERNAME}:${process.env.ESCROW_API_KEY}`).toString('base64');
const HEADERS = {
  'Authorization': ESCROW_AUTH,
  'Content-Type': 'application/json'
};

// api/payment.js
export async function paymentHandler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { amount, payerEmail, payeeEmail } = req.body;

  try {
    const response = await fetch(`${process.env.ESCROW_BASE_URL}/transaction`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        currency: 'usd',
        description: 'Test Escrow Payment',
        parties: [
          { customer: 'me', role: 'buyer' },
          { customer: payeeEmail, role: 'seller' }
        ],
        items: [{
          description: 'Test Item',
          title: 'Item of test',
          type: 'general_merchandise',
          quantity: 1,
          inspection_period: 259200,
          schedule: [{
            amount: amount,
            payer_customer: 'me',
            beneficiary_customer: payeeEmail
          }]
        }]
      })
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Failed to create payment' });
  }
}

