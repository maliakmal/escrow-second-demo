import fetch from 'node-fetch';

const ESCROW_AUTH = 'Basic ' + Buffer.from(`${process.env.ESCROW_API_USERNAME}:${process.env.ESCROW_API_KEY}`).toString('base64');
const HEADERS = {
  'Authorization': ESCROW_AUTH,
  'Content-Type': 'application/json'
};

// api/fundTransaction.js
export async function fundHandler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { transactionId } = req.body;

  try {
    const response = await fetch(`${process.env.ESCROW_BASE_URL}/transaction/${transactionId}/fund`, {
      method: 'POST',
      headers: HEADERS
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Failed to fund transaction' });
  }
}


