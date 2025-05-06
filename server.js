require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

const ESCROW_AUTH = 'Basic ' + Buffer.from(`${process.env.ESCROW_API_USERNAME}:${process.env.ESCROW_API_KEY}`).toString('base64');

const HEADERS = {
  'Authorization': ESCROW_AUTH,
  'Content-Type': 'application/json'
};

// Create transaction
app.post('/api/payment', async (req, res) => {
  const { amount, payerEmail, payeeEmail } = req.body;
  try {
    const response = await fetch(`${process.env.ESCROW_BASE_URL}/transaction`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        currency: 'usd',
        description: 'Test Escrow Payment',
        parties: [
          { customer: 'me', role: 'buyer'},
          { customer: payeeEmail , role: 'seller'}
        ],
        items: [
          {
            description: 'Test Item',
            title: 'Item of test',
            type: 'general_merchandise',
            quantity: 1,
            inspection_period: 259200,
            schedule: [
              {
                amount: amount,
                payer_customer: 'me',
                beneficiary_customer: payeeEmail
              }
            ]
          }
        ]
      })
    });

    const text = await response.text();  // <-- To catch malformed JSON
    console.log('Escrow API response:', text);
    console.dir(response);

    const data = JSON.parse(text);
    res.json(data);
  } catch (err) {
    console.dir(err);
    console.error('Error creating payment:', err);
    res.status(500).send("Error creating payment");
  }
});

// Release payment
app.post('/api/release', async (req, res) => {
  const { transactionId } = req.body;
  try {
    const result = await fetch(`${process.env.ESCROW_BASE_URL}/transaction/${transactionId}/action/release`, {
      method: 'POST',
      headers: HEADERS
    });
    const data = await result.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error releasing payment");
  }
});

app.get('/api/transactions', async (req, res) => {
  try {
    const response = await fetch(`${process.env.ESCROW_BASE_URL}/transaction`, {
      method: 'GET',
      headers: HEADERS
    });

    const text = await response.text();
    const data = JSON.parse(text);

    res.json(data);
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).send("Error fetching transactions");
  }
});


// Cancel payment
app.post('/api/cancel', async (req, res) => {
  const { transactionId } = req.body;
  try {
    const result = await fetch(`${process.env.ESCROW_BASE_URL}/transaction/${transactionId}/action/cancel`, {
      method: 'POST',
      headers: HEADERS
    });
    const data = await result.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error canceling payment");
  }
});

const simulateClick = async (landingPageUrl) => {
  try {
    // Simulate a GET request to the landing page (this is like "clicking" it)
    const response = await fetch(landingPageUrl);

    // You can return the response data or check its status here
    if (response.ok) {
      console.log('Simulated click success!');
      return response.text(); // or response.json() depending on the page response
    } else {
      console.log('Failed to simulate click');
      return null;
    }
  } catch (err) {
    console.error('Error simulating click:', err);
    return null;
  }
};


app.post('/api/transaction/:id/disbursement', async (req, res) => {
  const { id } = req.params;

  const payload = {
    type: "wire_transfer",
    currency: "usd",
    account_name: "John Smith",
    bank_aba_routing_number: "123456789",
    bank_account_number: "2303120",
    bank_branch_number: "9292932",
    bank_iban: "2929292",
    bank_swift_code: "29292902",
    international_routing_code: "2901011",
    bank_name: "Amazing Savings Bank of Canada",
    bank_address: {
      line1: "Bay Street",
      city: "Thunder Bay",
      state: "Ontario",
      country: "CA",
      post_code: "P7E"
    },
    intermediary_bank: {
      bank_aba_routing_number: "290303030",
      bank_name: "Not-so-amazing Bank",
      bank_address: {
        line1: "310 Montgomery St",
        city: "San Francisco",
        state: "CA",
        country: "US",
        post_code: "292910"
      },
      bank_swift_code: "199292",
      bank_account_number: "202001"
    },
    beneficiary_address: {
      line1: "1285 West Broadway",
      line2: "Apartment 301020",
      city: "Vancouver",
      state: "British Columbia",
      country: "CA",
      post_code: "10203"
    }
  };

  try {
    const response = await fetch(`${process.env.ESCROW_BASE_URL}/transaction/${id}/disbursement_methods`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Disbursement API error:', data);
      return res.status(400).json({ error: 'Failed to set disbursement method', details: data });
    }

    res.json({ message: 'Disbursement method added successfully', data });
  } catch (err) {
    console.error('Disbursement setup failed:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/api/transaction/:id/agree', async (req, res) => {
  const { id } = req.params;

  try {
    // Step 1: Fetch the Escrow landing page link
    const response = await fetch(`${process.env.ESCROW_BASE_URL}/transaction/${id}/web_link/agree`, {
      method: 'GET',
      headers: HEADERS
    });

    console.dir(response);

    const data = await response.json();

    if (!response.ok || !data.landing_page) {
      return res.status(400).json({
        error: 'Failed to get web link',
        details: data
      });
    }

    const link = data.landing_page;

    // Step 2: Simulate clicking the link by requesting it server-side
    const simulateResponse = await fetch(link);

    if (!simulateResponse.ok) {
      return res.status(500).json({
        error: 'Failed to simulate click on the link',
        statusCode: simulateResponse.status
      });
    }

    const simulatedHtml = await simulateResponse.text();

    // Step 3: Return both the link and the result of the "click"
    res.json({
      message: 'Successfully simulated click',
      landing_page: link,
      result_snippet: simulatedHtml.slice(0, 500) // Optional: just preview part of it
    });

  } catch (err) {
    console.error('Error during simulate-agree:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.post('/api/action/transaction/:id/:action', async (req, res) => {
  const { id, action } = req.params;

  // Optional: validate allowed actions

  try {
    const response = await fetch(`${process.env.ESCROW_BASE_URL}/transaction/${id}`, {
      method: 'PATCH',
      headers: HEADERS,
      body: JSON.stringify({ action }) 
    });
    console.dir(response);

    const data = await response.json();
    if (!response.ok) {
      console.error(`Error performing '${action}' on transaction ${id}:`, data);
      return res.status(400).json({ error: `Failed to ${action} transaction`, details: data });
    }

    res.json({ message: `Transaction ${action}d successfully`, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.post('/api/fund/transaction/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const response = await fetch(`${process.env.ESCROW_BASE_URL}/transaction/${id}/payment_methods/wire_transfer`, {
      method: 'POST',
      headers: HEADERS
    });
    console.dir(response);

    const data = await response.json();
    if (!response.ok) {
      console.error(`Error funding transaction ${id}:`, data);
      return res.status(400).json({ error: `Failed to fundtransaction`, details: data });
    }

    res.json({ message: `Transaction funded successfully`, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// RELEASE a payment
app.post('/api/release/:id', async (req, res) => {
  const transactionId = req.params.id;

  try {
    const response = await fetch(`${process.env.ESCROW_BASE_URL}/2017-09-01/transaction/${transactionId}/release`, {
      method: 'POST',
      headers: HEADERS
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Release error:", data);
      return res.status(400).json({ error: "Failed to release funds", details: data });
    }

    res.json({ message: "Payment released", data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// CANCEL a payment
app.post('/api/cancel/:id', async (req, res) => {
  const transactionId = req.params.id;

  try {
    const response = await fetch(`${process.env.ESCROW_BASE_URL}/2017-09-01/transaction/${transactionId}/cancel`, {
      method: 'POST',
      headers: HEADERS
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Cancel error:", data);
      return res.status(400).json({ error: "Failed to cancel payment", details: data });
    }

    res.json({ message: "Payment canceled", data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
