const axios = require('axios');
const moment = require('moment');
const { MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE, MPESA_PASSKEY, CALLBACK_URL } = require('../config/mpesaConfig');

const getAccessToken = async () => {
    try {
        const response = await axios.get(
            'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
            {
                auth: {
                    username: MPESA_CONSUMER_KEY,
                    password: MPESA_CONSUMER_SECRET,
                },
            }
        );
        return response.data.access_token;
    } catch (error) {
        console.error('Error getting access token:', error.response?.data || error.message);
        throw error;
    }
};

const stkPush = async (req, res) => {
    const { phone, amount } = req.body;
    if (!phone || !amount) {
        return res.status(400).json({ type: "error", message: "Phone number and amount are required." });
    }
    try {
        const accessToken = await getAccessToken();
        const timestamp = moment().format('YYYYMMDDHHmmss');
        const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64');

        const response = await axios.post(
            'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
            {
                BusinessShortCode: MPESA_SHORTCODE,
                Password: password,
                Timestamp: timestamp,
                TransactionType: 'CustomerPayBillOnline',
                Amount: amount,
                PartyA: phone,
                PartyB: MPESA_SHORTCODE,
                PhoneNumber: phone,
                CallBackURL: CALLBACK_URL,
                AccountReference: 'TestPayment',
                TransactionDesc: 'Payment for test service',
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        return res.status(200).json({ type: "success", message: "STK Push initiated successfully" });
    } catch (error) {
        console.error('Error initiating STK Push:', error.response?.data || error.message);
        return res.status(500).json({ type: "error", message: "Failed to initiate STK Push", error: error.message });
    }
};

const callBack = async (req, res) => {
    console.log("Received M-Pesa Callback");

    let callbackData = req.body;

    fs.writeFileSync("mpesa_transactions.json", JSON.stringify(callbackData, null, 2));

    if (callbackData.Body.stkCallback) {
        let stkCallback = callbackData.Body.stkCallback;
        let resultCode = stkCallback.ResultCode;

        if (resultCode === 0) {
            // Successful transaction
            let transactionDetails = {
                merchantRequestId: stkCallback.MerchantRequestID,
                checkoutRequestId: stkCallback.CheckoutRequestID,
                amount: stkCallback.CallbackMetadata.Item.find(item => item.Name === "Amount").Value,
                mpesaReceiptNumber: stkCallback.CallbackMetadata.Item.find(item => item.Name === "MpesaReceiptNumber").Value,
                phoneNumber: stkCallback.CallbackMetadata.Item.find(item => item.Name === "PhoneNumber").Value,
                transactionDate: stkCallback.CallbackMetadata.Item.find(item => item.Name === "TransactionDate").Value
            };

            console.log("Transaction Successful:", transactionDetails);

            // Save to file (or database)
            fs.writeFileSync("mpesa_transactions.json", JSON.stringify(transactionDetails, null, 2));
        } else {
            console.log("Transaction Failed:", stkCallback);
        }
    }

    res.status(200).send("Callback received");
};


module.exports = { stkPush, callBack };
