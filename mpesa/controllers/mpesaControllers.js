const axios = require('axios');
const moment = require('moment');
const fs = require('fs');
const { MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE, MPESA_PASSKEY, MPESA_CALLBACK_URL } = require('../config/mpesaConfig');
const { addMpesaCode, updateMpesaCode } = require("../../actions/operations")

const getAccessToken = async () => {
    try {
        console.log("Mpesa Shortcode:", MPESA_SHORTCODE, "Mpesa Consumer Key:", MPESA_CONSUMER_KEY, "Mpesa Consumer Secret:", MPESA_CONSUMER_SECRET, "Mpesa Passkey", MPESA_PASSKEY, "Callback URL:", MPESA_CALLBACK_URL);
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

const formatPhoneNumber = (phone) => {
    if (phone.startsWith("0")) {
        return "254" + phone.substring(1);
    }
    return phone;
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
                // TransactionType: 'CustomerPayBillOnline',
                TransactionType: 'CustomerBuyGoodsOnline',
                Amount: amount,
                PartyA: formatPhoneNumber(phone),
                PartyB: MPESA_SHORTCODE,
                PhoneNumber: phone,
                CallBackURL: MPESA_CALLBACK_URL,
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

        if (response.data.ResponseCode === "0") {
            const mpesaCode = {
                code: response.data.CheckoutRequestID,
                phone: phone,
                status: "PENDING"
            }
            const addMpesaCodeTodb = await addMpesaCode(mpesaCode);
            if (addMpesaCodeTodb) {
                return res.status(200).json({ type: "success", message: "STK Push initiated successfully", data: response.data });
            }
        }
    } catch (error) {
        console.error('Error initiating STK Push:', error.response || error.message);
        return res.status(500).json({ type: "error", message: "Failed to initiate STK Push", error: error.message });
    }
};

const callBack = async (req, res) => {
    console.log("Received M-Pesa Callback");

    let callbackData = req.body;

    if (callbackData.Body.stkCallback) {
        let stkCallback = callbackData.Body.stkCallback;
        let resultCode = stkCallback.ResultCode;

        if (resultCode === 0) {
            let transactionDetails = {
                merchantRequestId: stkCallback.MerchantRequestID,
                checkoutRequestId: stkCallback.CheckoutRequestID,
                amount: stkCallback.CallbackMetadata.Item.find(item => item.Name === "Amount").Value,
                mpesaReceiptNumber: stkCallback.CallbackMetadata.Item.find(item => item.Name === "MpesaReceiptNumber").Value,
                phoneNumber: stkCallback.CallbackMetadata.Item.find(item => item.Name === "PhoneNumber").Value,
                transactionDate: stkCallback.CallbackMetadata.Item.find(item => item.Name === "TransactionDate").Value
            };

            console.log("Transaction Successful:", transactionDetails);

            const mpesaCode = {
                code: transactionDetails.mpesaReceiptNumber,
                phone: transactionDetails.phoneNumber,
                status: "SUCCESS"
            }
            const updateMpesaCodeTodb = await updateMpesaCode(transactionDetails.checkoutRequestId, mpesaCode);
            if (updateMpesaCodeTodb) {
                return res.status(200).json({ type: "success", message: "Transaction successful", data: transactionDetails });
            }
        } else {
            const mpesaCode = {
                code: stkCallback.CheckoutRequestID,
                status: "FAILED"
            }
            const updateMpesaCodeTodb = await updateMpesaCode(stkCallback.CheckoutRequestID, mpesaCode);
            if (updateMpesaCodeTodb) {
                console.log("Transaction Failed:", stkCallback);
                return res.status(200).json({ type: "error", message: "Transaction not successful", data: transactionDetails });
            }
        }
    }

    res.status(200).send("Callback received");
};


module.exports = { stkPush, callBack };
