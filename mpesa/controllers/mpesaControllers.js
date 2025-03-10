const axios = require('axios');
const moment = require('moment');
const { MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE, MPESA_PASSKEY, MPESA_CALLBACK_URL, MPESA_STK_URL, MPESA_AUTH_URL } = require('../config/mpesaConfig');
const { addMpesaCode, updateMpesaCode, createUser, getPackage, updateUser } = require("../../actions/operations");
const { emitEvent } = require("../../socket/controllers/socketController");
const { manageMikrotikUser } = require("../../mikrotik/contollers/mikrotikController");

const getAccessToken = async () => {
    try {
        console.log("Mpesa Shortcode:", MPESA_SHORTCODE, "Mpesa Consumer Key:", MPESA_CONSUMER_KEY, "Mpesa Consumer Secret:", MPESA_CONSUMER_SECRET, "Mpesa Passkey", MPESA_PASSKEY, "Callback URL:", MPESA_CALLBACK_URL);
        const response = await axios.get(
            MPESA_AUTH_URL,
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
    const { phone, amount, package } = req.body;
    if (!phone || !amount) {
        return res.status(400).json({ type: "error", message: "Phone number and amount are required." });
    }
    try {
        const accessToken = await getAccessToken();
        const timestamp = moment().format('YYYYMMDDHHmmss');
        const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64');
        console.log(formatPhoneNumber(phone));
        
        const response = await axios.post(
            MPESA_STK_URL,
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
            const userData = {
                token:response.data.CheckoutRequestID,
                phone: phone,
                package: package,
                status: "inactive",
                platformID: package.platformID
            }
            const addMpesaCodeTodb = await addMpesaCode(mpesaCode);
            const addUserTodb = await createUser(userData);
            if (addMpesaCodeTodb && addUserTodb) {
                return res.status(200).json({ type: "success", message: "STK Push initiated successfully", data: response.data });
            }
        }
    } catch (error) {
        console.error('Error initiating STK Push:', error.response || error.message);
        return res.status(500).json({ type: "error", message: "Failed to initiate STK Push", error: error.message });
    }
};

const callBack = async (req, res) => {
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

            const user = await getUserByToken(transactionDetails.checkoutRequestId);

            if (!user) {
                return res.status(404).json({ type: "error", message: "User not found!" });
            }

            if (parseFloat(transactionDetails.amount) !== parseFloat(user.package.price)) {
                return res.status(400).json({ type: "error", message: "Invalid operation!" });
            }
            const package = await getPackage(user.packageID);
            if (package.price !== transactionDetails.amount) {
                return res.status(400).json({ type: "error", message: "Invalid operation!" });
            }
            const mpesaCode = {
                code: transactionDetails.mpesaReceiptNumber,
                phone: transactionDetails.phoneNumber,
                status: "SUCCESS"
            };
            await updateMpesaCode(transactionDetails.checkoutRequestId, mpesaCode);
            await updateUser(user.id, "active");

            const mikrotikUser = await manageMikrotikUser({
                platformID: user.platformID,
                action: "add",
                package:package
            });

            // Send User Data to Client via WebSocket
            emitEvent("payment-confirmed", {
                phone: transactionDetails.phoneNumber,
                message: "Payment Successful!",
                transactionDetails,
                mikrotikUser
            });

            return res.status(200).json({ type: "success", message: "Transaction successful", data: transactionDetails });
        } else {
            // Payment Failed
            const mpesaCode = {
                code: stkCallback.CheckoutRequestID,
                status: "FAILED"
            };
            await updateMpesaCode(stkCallback.CheckoutRequestID, mpesaCode);

            emitEvent("payment-failed", {
                phone: stkCallback.PhoneNumber,
                message: "Payment Failed!",
            });

            console.log("Transaction Failed:", stkCallback);
            return res.status(400).json({ type: "error", message: "Transaction not successful" });
        }
    }

    res.status(200).send("Callback received");
};



module.exports = { stkPush, callBack };
