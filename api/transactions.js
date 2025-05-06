import fetch from 'node-fetch';

const ESCROW_AUTH = 'Basic ' + Buffer.from(`${process.env.ESCROW_API_USERNAME}:${process.env.ESCROW_API_KEY}`).toString('base64');
const HEADERS = {
  'Authorization': ESCROW_AUTH,
  'Content-Type': 'application/json'
};

// api/transactions.js
export async function transactionsHandler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const response = await fetch(`${process.env.ESCROW_BASE_URL}/transaction`, {
      headers: HEADERS
    });
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Failed to retrieve transactions' });
  }
}
