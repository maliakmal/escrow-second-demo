import fetch from 'node-fetch';

const ESCROW_AUTH = 'Basic ' + Buffer.from(`${process.env.ESCROW_API_USERNAME}:${process.env.ESCROW_API_KEY}`).toString('base64');
const HEADERS = {
  'Authorization': ESCROW_AUTH,
  'Content-Type': 'application/json'
};

// action: payment
async function handlePayment(body, res) {
  const { amount, payerEmail, payeeEmail } = body;

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


// action: agree, disbursement
async function handleDefault(body, res){

  const { action, transaction_id } = body;

  try {
    const response = await fetch(`${process.env.ESCROW_BASE_URL}/transaction/${transaction_id}/${action}`, {
      method: 'PATCH',
      headers: HEADERS
    });
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Failed to retrieve transactions' });
  }
}

// action: fund
async function handleFund(body, res){

  const { action, transaction_id } = body;

  try {
    const response = await fetch(`${process.env.ESCROW_BASE_URL}/transaction/${transaction_id}/payment_methods/wire_transfer`, {
      method: 'POST',
      headers: HEADERS
    });
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Failed to retrieve transactions' });
  }
}

// action: transaction
async function handleTransaction(body, res){

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

// api/actions
export default async function actionsHandler(req, res) {

  const { method, body } = req;
  const action = body?.action || 'default';

  try {
    switch (action) {
      case 'transactions':
      case 'transaction':
        return await handleTransaction(body, res);
      case 'fund':
        return await handleFund(body, res);
      case 'payment':
        return await handlePayment(body, res);
      default:
        return await handleDefault(body, res);;
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }

}
