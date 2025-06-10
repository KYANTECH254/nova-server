const axios = require('axios');
const moment = require('moment');
const IntaSend = require('intasend-node');
const ENVIRONMENT = process.env.ENVIRONMENT;
let intasend = new IntaSend(
    process.env.INTASEND_PUBLISHABLE_KEY,
    process.env.INTASEND_SECRET_KEY,
    ENVIRONMENT === "production" ? true : false,
);
const { MPESA_CALLBACK_URL, MPESA_AUTH_LIVE_URL, MPESA_STK_LIVE_URL } = require('../config/mpesaConfig');
const {
    addMpesaCode,
    updateMpesaCode,
    getPackage,
    updateUser,
    getPlatformConfig,
    getAdminsByID,
    getFunds,
    updateFunds,
    getMpesaCode,
    createFunds,
    getPackagesByAmount,
    getSuperAdminsByPlatform,
    getUserByCode,
    getMpesaByCode,
    getPendingTransactions
} = require("../../actions/operations");
const { emitEvent } = require("../../socket/controllers/socketController");
const { manageMikrotikUser, AuthenticateRequest } = require("../../mikrotik/contollers/mikrotikController");
const { addManualCode } = require("../../controllers/mikrotikController");
const { EmailTemplate } = require('../../mailer/mailerTemplates');
const PAYSTACK_secretKey = process.env.PAYSTACK_SECRET_KEY;

const getAccessToken = async (platform) => {
    try {
        const response = await axios.get(
            MPESA_AUTH_LIVE_URL,
            {
                auth: {
                    username: platform.mpesaConsumerKey,
                    password: platform.mpesaConsumerSecret,
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
    const { phone, amount, package, platformID } = req.body;
    if (!phone || !amount) {
        return res.status(400).json({ type: "error", message: "Phone number and amount are required." });
    }

    if (!package) {
        return res.status(400).json({ type: "error", message: "Missing credentials required!" });
    }

    try {
        const platform = await getPlatformConfig(platformID);
        if (!platform) {
            return res.status(400).json({ type: "error", message: "Configure Platform payments to continue!" });
        }

        const C2B = platform.IsC2B;
        const API = platform.IsAPI;
        const B2B = platform.IsB2B;
        const shortCode = platform.mpesaShortCode;
        const shortCodetype = platform.mpesaShortCodeType;

        let response;
        let checkoutRequestId;

        if (C2B) {
            // const apiUrl = "https://apicrane.tonightleads.com/api/mpesa-deposit/initiate";
            // const bodyData = {
            //     mpesaNumber: formatPhoneNumber(phone),
            //     amount: amount,
            //     paymentType: shortCodetype === "paybill" ? 'CustomerPayBillOnline' : 'CustomerBuyGoods',
            //     tillOrPaybill: shortCode,
            //     accountNumber: shortCodetype === "paybill" ? shortCode : '',
            //     callback: process.env.MPESA_CALLBACK_URL,
            //     token: "test-token",
            // };
            // response = await axios.post(apiUrl, bodyData);
            // checkoutRequestId = response.data?.CheckoutRequestID;
            // console.log("Subaccount code:", platform.mpesaSubAccountCode);

            const response = await axios.post(
                'https://api.paystack.co/transaction/initialize',
                {
                    email: `${phone}@novawifi.online`,
                    amount: parseFloat(amount) * 100,
                    subaccount: platform.mpesaSubAccountCode,
                    callback_url: '',
                    currency: "KES"
                },
                {
                    headers: {
                        Authorization: `Bearer ${PAYSTACK_secretKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            const mpesaCode = {
                platformID: platformID,
                amount: amount,
                code: response.data.data.reference,
                phone: phone,
                status: "PENDING",
                reqcode: response.data.data.reference
            };
            const addMpesaCodeTodb = await addMpesaCode(mpesaCode);
            if (addMpesaCodeTodb) {
                return res.status(200).json({
                    type: "success",
                    message: "STK Push initiated successfully",
                    data: {
                        checkoutRequestId: response.data.data.reference,
                        authorization_url: response.data.data.authorization_url
                    }
                });
            }
        } else if (API) {
            const accessToken = await getAccessToken(platform);
            const timestamp = moment().format('YYYYMMDDHHmmss');
            const password = Buffer.from(`${platform.mpesaShortCode}${platform.mpesaPassKey}${timestamp}`).toString('base64');

            response = await axios.post(
                MPESA_STK_LIVE_URL,
                {
                    BusinessShortCode: platform.mpesaShortCode,
                    Password: password,
                    Timestamp: timestamp,
                    TransactionType: platform.mpesaShortCodeType === "paybill" ? 'CustomerPayBillOnline' : 'CustomerBuyGoodsOnline',
                    Amount: amount,
                    PartyA: formatPhoneNumber(phone),
                    PartyB: platform.mpesaShortCode,
                    PhoneNumber: formatPhoneNumber(phone),
                    CallBackURL: MPESA_CALLBACK_URL,
                    AccountReference: platform.mpesaShortCodeType === "paybill" ? 'PayBill' : 'BuyGoods',
                    TransactionDesc: 'WiFi Subscription Payment',
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            checkoutRequestId = response.data?.CheckoutRequestID;
        } else if (B2B) {
            const collection = intasend.collection();
            response = await collection.mpesaStkPush({
                first_name: 'Joe',
                last_name: 'Doe',
                email: 'joe@doe.com',
                host: 'https://novawifi.online/',
                amount: amount,
                phone_number: formatPhoneNumber(phone),
                api_ref: 'Nova WiFi',
            });
            checkoutRequestId = response?.invoice?.invoice_id;
        }

        if (checkoutRequestId) {
            const mpesaCode = {
                platformID: platformID,
                amount: amount,
                code: checkoutRequestId,
                phone: phone,
                status: "PENDING",
                reqcode: checkoutRequestId
            };
            const addMpesaCodeTodb = await addMpesaCode(mpesaCode);
            if (addMpesaCodeTodb) {
                return res.status(200).json({
                    type: "success",
                    message: "STK Push initiated successfully",
                    data: {
                        checkoutRequestId: checkoutRequestId,
                    }
                });
            }
        }

        return res.status(400).json({ type: "error", message: "Failed to initiate STK Push" });
    } catch (error) {
        console.error('Error initiating STK Push:', error.response?.data || error.message);
        return res.status(500).json({
            type: "error",
            message: "Failed to initiate STK Push",
            error: error.message
        });
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
            const upddata = {
                status: "active",
            }
            await updateUser(user.id, upddata);

            const mikrotikUser = await manageMikrotikUser({
                platformID: user.platformID,
                action: "add",
                package: package
            });

            emitEvent("deposit-success", {
                status: "COMPLETE",
                checkoutRequestId: invoice_id,
                message: "Transaction successful",
                loginCode: mikrotikUser.code.username
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

const WithdrawFunds = async (req, res) => {
    const { token, amount } = req.body;
    if (!token) {
        return res.json({
            success: false,
            message: "Missing credentials required 2!",
        });
    }
    const auth = await AuthenticateRequest(token);
    if (!auth.success) {
        return res.json({
            success: false,
            message: auth.message,
        });
    }

    const platformID = auth.admin.platformID;
    const adminID = auth.admin.adminID;
    if (!adminID || !platformID || !amount) {
        return res.status(400).json({
            success: false,
            message: "Missing fields are required!",
        });
    }

    if (!validateWithdrawalAmount(amount)) {
        return res.status(400).json({
            success: false,
            message: "Invalid amount, try again!",
        });
    }

    try {
        const admin = await getAdminsByID(adminID);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin does not exist!",
            });
        }

        const checkFundsAccount = await getFunds(platformID);
        if (!checkFundsAccount) {
            return res.status(404).json({
                success: false,
                message: "Platform account does not exist!",
            });
        }

        if (checkFundsAccount.balance < amount) {
            return res.status(400).json({
                success: false,
                message: "Insufficient funds for withdrawal!",
            });
        }

        const platformCredentials = await getPlatformConfig(platformID);
        const isB2B = platformCredentials.IsB2B;
        if (!isB2B) {
            return res.status(400).json({
                success: false,
                message: "Invalid operation for withdrawal, configure B2B payments on the Settings Tab first!",
            });
        }

        const paymentType = platformCredentials.mpesaShortCodeType;
        const shortCode = platformCredentials.mpesaShortCode;
        const accountReference = platformCredentials.mpesaAccountNumber;

        const IsPhone = paymentType === "Phone";
        const IsTill = paymentType === "Till";
        const IsPaybill = paymentType === "Paybill";
        let phone;
        let till;
        let paybill;

        if (paymentType === "Phone") {
            phone = shortCode;
        } else if (paymentType === "Till") {
            till = shortCode;
        } else if (paymentType === "Paybill") {
            paybill = shortCode;
        }
        const payouts = intasend.payouts();
        let resp;
        if (IsPhone) {
            resp = await payouts.mpesa({
                currency: "KES",
                transactions: [
                    {
                        name: "Nova Client",
                        account: formatPhoneNumber(phone),
                        amount: amount,
                        narrative: "Nova WiFi Withdrawal",
                    },
                ],
            });
        } else {
            resp = await payouts.mpesa_b2b({
                currency: "KES",
                transactions: [
                    {
                        name: "Nova Client",
                        account: shortCode,
                        account_type: IsTill ? "Till" : "PayBill",
                        account_reference: IsPaybill ? accountReference : "",
                        amount: amount,
                        narrative: "Nova WiFi Withdrawal",
                    },
                ],
            });
        }
        const response = decodeBuffer(resp);
        const fileID = response.file_id;
        const currentTransaction = response.transactions[0];
        const status = currentTransaction.status;
        if (fileID) {
            const mpesaCode = await addMpesaCode({ code: fileID, phone, amount, type: "withdrawal", status, till, paybill, accountReference });
            return res.status(200).json({
                success: true,
                message: "Withdrawal initiated successfully!",
                mpesaCode,
            });
        } else {
            return res.status(400).json({
                success: false,
                message: "Withdrawal failed! Intasend error.",
                error: statusResponse.error || "Unknown error",
            });
        }

    } catch (err) {
        console.error("An error occurred:", decodeBuffer(err));
        return res.status(500).json({
            success: false,
            message: "Withdrawal request failed, try again later!",
            error: decodeBuffer(err).errors[0].detail
        });
    }
};

const handleIntasendCallback = async (req, res) => {
    const { file_id, transactions, challenge } = req.body;
    if (challenge !== process.env.INTASEND_CHALLENGE) {
        return res.status(400).json({
            success: false,
            message: "Unauthorized request!",
        });
    }

    if (!file_id || !transactions || !transactions.length) {
        return res.status(400).json({
            success: false,
            message: "Missing required fields in callback data!",
        });
    }

    try {
        const transaction = transactions[0];
        const { status, amount } = transaction;

        const mpesaCode = await getMpesaCode(file_id);
        if (!mpesaCode) {
            return res.status(404).json({
                success: false,
                message: "MPesa code not found for the given request reference ID.",
            });
        }

        if (status === "Successful") {
            const funds = await getFunds(mpesaCode.platformID);
            const newBalance = parseFloat(funds.balance) - parseFloat(amount);
            const withdrawals = funds.withdrawals
                ? parseFloat(funds.withdrawals) + parseFloat(amount)
                : parseFloat(amount);
            await updateFunds(mpesaCode.platformID, {
                balance: `${newBalance.toFixed(2)}`,
                withdrawals: `${withdrawals.toFixed(2)}`
            });
        }

        let new_status;
        if (status === "Pending") {
            new_status = "PENDING";
        } else if (status === "Successful") {
            new_status = "COMPLETE";
        }

        await updateMpesaCode(mpesaCode.code, {
            status: new_status,
            amount,
            platformID: mpesaCode.platformID,
            type: 'withdrawal',
        });

        const admins = await getSuperAdminsByPlatform(mpesaCode.platformID);
        if (admins && admins.length > 0) {
            for (const admin of admins) {
                const name = admin.name;
                const email = admin.email;
                const type = "info"
                const subject = `Successful withdrawal request!`
                const message = `You withdrawal of ${amount} KES has been send to your M-PESA account.`;
                const data = {
                    name: name,
                    type: "info",
                    email: email,
                    subject: subject,
                    message: message
                }
                const sendwithdrawalemail = await EmailTemplate(data);
                if (!sendwithdrawalemail.success) {
                    return res.status(200).json({
                        success: false,
                        message: sendwithdrawalemail.message,
                        admins: admins
                    });
                }
            }
        }

        return res.status(200).json({
            success: true,
            message: "Withdrawal callback processed.",
            admins: admins
        });
    } catch (err) {
        console.error("Error processing callback:", err);
        return res.status(500).json({
            success: false,
            message: "Internal server error while processing callback.",
            error: err.message,
        });
    }
}

const handleIntasendDepositCallback = async (req, res) => {
    return res.status(200).json({
        success: true,
        message: 'Webhook event received but ignored',
    });
    const {
        invoice_id,
        state,
        net_amount,
        account,
        challenge,
        mpesa_reference,
        failed_reason,
        value
    } = req.body;

    if (challenge !== process.env.INTASEND_CHALLENGE) {
        return res.status(400).json({
            success: false,
            message: "Unauthorized request!",
        });
    }

    if (!invoice_id || !state || !net_amount || !account) {
        return res.status(400).json({
            success: false,
            message: "Missing required fields in callback data!",
        });
    }

    try {
        const mpesaCode = await getMpesaCode(invoice_id);
        if (!mpesaCode) {
            return res.status(404).json({
                success: false,
                message: "MPesa code not found for the given invoice ID.",
            });
        }

        if (state === "COMPLETE") {
            const referenceCode = (mpesa_reference && mpesa_reference.trim() !== "") ? mpesa_reference : invoice_id;
            await updateMpesaCode(referenceCode, {
                code: invoice_id,
                status: state,
                amount: net_amount,
                platformID: mpesaCode.platformID,
                type: 'deposit',
            });

            const funds = await getFunds(mpesaCode.platformID);
            if (!funds) {
                await createFunds({
                    balance: net_amount,
                    withdrawals: "0",
                    deposits: "0",
                    platformID: mpesaCode.platformID
                })
            } else {
                const newBalance = parseFloat(funds.balance) + parseFloat(net_amount);
                await updateFunds(mpesaCode.platformID, {
                    balance: `${newBalance.toFixed(2)}`
                });
            }
            const pkg = await getPackagesByAmount(mpesaCode.platformID, `${value}`);
            if (!pkg) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid package`,
                    value: value
                });
            }
            const data = {
                phone: mpesaCode.phone,
                packageID: pkg.id,
                platformID: mpesaCode.platformID,
                package: pkg,
                code: invoice_id,
            }
            const addcodetorouter = await addManualCode(data);
            if (!addcodetorouter.success) {
                return res.status(400).json({
                    success: false,
                    message: `An error occured: ${addcodetorouter.message}`,
                });
            }

            emitEvent("deposit-success", {
                status: state,
                checkoutRequestId: invoice_id,
                message: "Payment successful!",
                loginCode: addcodetorouter.code.username
            });
        } else {
            await updateMpesaCode(invoice_id, {
                status: state,
                amount: net_amount,
                platformID: mpesaCode.platformID,
                type: 'deposit',
            });

            emitEvent("deposit-status", {
                status: state,
                checkoutRequestId: invoice_id,
                message: failed_reason
            });
        }

        return res.status(200).json({
            success: true,
            message: "Deposit callback processed.",
        });
    } catch (err) {
        console.error("Error processing deposit callback:", err);
        return res.status(500).json({
            success: false,
            message: "Internal server error while processing deposit callback.",
            error: err.message,
        });
    }
}

const checkPayment = async (req, res) => {
    const {
        code
    } = req.body;

    if (!code) {
        return res.status(400).json({
            success: false,
            message: "Mpesa code is required",
        });
    }

    try {
        const getuser = await getMpesaByCode(code);
        if (!getuser) {
            return res.status(404).json({
                success: false,
                message: "MPesa information not found for the given invoice ID.",
            });
        }
        const state = getuser.status;
        if (state === "COMPLETE") {
            const userlogincode = await getUserByCode(code)
            if (!userlogincode) {
                return res.status(404).json({
                    success: false,
                    message: "Mikrotik user information not found.",
                });
            }
            return res.status(200).json({
                success: true,
                message: "Payment received succesfully.",
                status: state,
                checkoutRequestId: getuser.code,
                loginCode: userlogincode.username
            });
        } else if (state === "PENDING") {
            return res.status(200).json({
                success: false,
                message: "Waiting for Payment.",
                status: state,
                checkoutRequestId: getuser.code,
            });
        } else if (state === "FAILED") {
            return res.status(200).json({
                success: false,
                message: "Payment failed try again.",
                status: state,
                checkoutRequestId: getuser.code,
            });
        }
    } catch (err) {
        console.error("Error processing payment:", err);
        return res.status(500).json({
            success: false,
            message: "Internal server error while processing payment.",
            error: err.message,
        });
    }
}

const handlePaystackDepositCallback = async (req, res) => {
    return res.status(200).json({
        success: true,
        message: 'Webhook event received but ignored',
    });

    if (!verifyPaystackSignature(req)) {
        return res.status(401).json({
            success: false,
            message: 'Invalid Paystack signature'
        });
    }

    const event = req.body;
    console.log("Deposit callback event:", event);

    if (event.event === 'charge.success') {
        const { reference, amount, currency, customer, subaccount } = event.data;

        try {
            const txVerify = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_secretKey}`
                }
            });

            const txData = txVerify.data.data;

            if (txData.status === 'success' && txData.currency === 'KES') {
                // Credit user wallet or save to DB
                const depositAmountKES = txData.amount / 100;

                console.log("Customer:", customer.email);
                console.log("Amount:", depositAmountKES, "KES");
                console.log("Reference:", reference);
                console.log("Subaccount:", subaccount);

                // await creditUserWallet(customer.email, depositAmountKES);

                return res.status(200).json({
                    success: true,
                    message: 'Customer deposit verified and processed successfully',
                    data: {
                        email: customer.email,
                        reference,
                        amount: depositAmountKES,
                        currency: txData.currency,
                        subaccount
                    }
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Transaction failed or currency mismatch',
                    data: {
                        reference,
                        currency: txData.currency,
                        status: txData.status
                    }
                });
            }

        } catch (error) {
            console.error("Error verifying transaction:", error.response?.data || error.message);
            return res.status(500).json({
                success: false,
                message: 'Error verifying transaction with Paystack',
                error: error.response?.data || error.message
            });
        }
    }

    // Event is not charge.success — ignore
    return res.status(200).json({
        success: true,
        message: 'Webhook event received but ignored',
        event: event.event
    });
};

const verifyPayments = async () => {
    const collection = intasend.collection();

    setInterval(async () => {
        try {
            const pendingTxs = await getPendingTransactions({ maxAgeMs: 7 * 24 * 60 * 60 * 1000 });
            for (const tx of pendingTxs) {
                const { code, amount, platformID, phone } = tx;
                try {
                    if (code === code.toLowerCase()) {
                        const txVerify = await axios.get(`https://api.paystack.co/transaction/verify/${code}`, {
                            headers: {
                                Authorization: `Bearer ${PAYSTACK_secretKey}`
                            }
                        });
                        const txData = txVerify.data.data;

                        if (txData.status === 'success' && txData.currency === 'KES') {
                            await handleSuccessfulPayment(code, txData);
                        } else if (['failed', 'reversed'].includes(txData.status)) {
                            await handleFailedPayment(code);
                        }
                    } else if (code === code.toUpperCase()) {
                        try {
                            const resp = await collection.status(code);
                            if (resp.invoice?.state === 'COMPLETE' && resp.invoice.currency === 'KES') {
                                await handleSuccessfulPayment(code, {
                                    amount: resp.invoice.value * 100,
                                    receipt_number: code,
                                    currency: resp.invoice.currency,
                                    status: 'success',
                                    invoice: resp.invoice,
                                    meta: resp.meta
                                });
                            } else if (resp.invoice?.state === 'FAILED') {
                                await handleFailedPayment(code);
                            } else {
                                console.log(`Payment ${code} status:`, resp.invoice?.state || 'unknown');
                            }
                        } catch (intasendError) {
                            console.error(`IntaSend verification error for ${code}:`,
                                intasendError.response?.data || intasendError.message);
                            continue;
                        }
                    }
                } catch (error) {
                    console.error(`Error verifying ${code}:`);
                }
            }
        } catch (err) {
            console.error("Error fetching pending transactions:", err.message);
        }
    }, 5 * 1000);
};

const handleSuccessfulPayment = async (code, txData) => {
    const depositAmountKES = txData.amount / 100;
    const receiptNumber = txData.receipt_number || code;

    await updateMpesaCode(code, {
        status: "COMPLETE",
        type: 'deposit',
        code: receiptNumber
    });

    const mpesaCode = await getMpesaCode(code);
    if (!mpesaCode) {
        console.error("MPesa code not found for:", code);
        return;
    }

    const pkg = await getPackagesByAmount(mpesaCode.platformID, `${depositAmountKES}`);
    if (!pkg) {
        console.error(`Invalid package for amount: ${depositAmountKES}`);
        return;
    }

    const data = {
        phone: mpesaCode.phone,
        packageID: pkg.id,
        platformID: mpesaCode.platformID,
        package: pkg,
        code: code,
    };

    const addcodetorouter = await addManualCode(data);
    if (!addcodetorouter.success) {
        console.error(`Error adding code: ${addcodetorouter.message}`);
        return;
    }

    emitEvent("deposit-success", {
        status: "COMPLETE",
        checkoutRequestId: code,
        message: "Payment successful",
        loginCode: addcodetorouter.code.username,
        amount: depositAmountKES,
        provider: txData.invoice?.provider || 'Paystack'
    });
};

const handleFailedPayment = async (code) => {
    await updateMpesaCode(code, {
        status: "FAILED",
        type: 'deposit'
    });

    emitEvent("deposit-status", {
        status: "FAILED",
        checkoutRequestId: code,
        message: "Payment failed"
    });
};

const validateWithdrawalAmount = (amount) => {
    if (!amount) return false;
    const num = parseFloat(amount);

    if (num > 150000) {
        return false;
    } else if (num < 1) {
        return false;
    } else if (isNaN(num)) {
        return false;
    }
    return true;
}

const decodeBuffer = (data) => {
    if (Buffer.isBuffer(data)) {
        try {
            return JSON.parse(data.toString());
        } catch (e) {
            return data.toString();
        }
    }
    return data;
};

const verifyPaystackSignature = (req) => {
    const hash = crypto
        .createHmac('sha512', PAYSTACK_secretKey)
        .update(JSON.stringify(req.body))
        .digest('hex');

    return hash === req.headers['x-paystack-signature'];
}

verifyPayments();
module.exports = {
    stkPush,
    callBack,
    formatPhoneNumber,
    WithdrawFunds,
    handleIntasendCallback,
    handleIntasendDepositCallback,
    checkPayment,
    handlePaystackDepositCallback,
};
 