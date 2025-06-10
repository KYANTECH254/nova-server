const first_withdrawal = {
    file_id: 'YGWRM70',
    device_id: null,
    tracking_id: 'a6bf52b4-81db-4e3a-8fd2-18484a84bb85',
    batch_reference: null,
    status: 'Confirming balance',
    status_code: 'BP104',
    nonce: '0856a0',
    wallet: {
        wallet_id: 'YM67WG0',
        label: 'default',
        can_disburse: false,
        currency: 'KES',
        wallet_type: 'SETTLEMENT',
        current_balance: 26.58,
        available_balance: 26.58,
        updated_at: '2025-04-27T16:30:37.071451+03:00'
    },
    transactions: [
        {
            status: 'Pending',
            status_code: 'TP101',
            request_reference_id: 'c4099f04-dd63-4a04-9ade-45848fb7221a',
            name: 'Nova Client',
            account: '254723551116',
            id_number: null,
            bank_code: null,
            amount: 10,
            narrative: 'Nova WiFi Withdrawal'
        }
    ],
    charge_estimate: 15,
    total_amount_estimate: 25,
    total_amount: 10,
    transactions_count: 1,
    created_at: '2025-04-27T17:21:14.574810+03:00',
    updated_at: '2025-04-27T17:21:14.877008+03:00'
}

const An_error_occurred = {
    type: 'client_error',
    errors: [
        {
            code: 'invalid_request_data',
            detail: 'Payment file must be in PREVIEW-AND-APPROVE state to perform this action',
            attr: null
        }
    ]
}

const Intasend_withdrawal_callback1 = {
    file_id: 'YGWRM70',
    tracking_id: 'a6bf52b4-81db-4e3a-8fd2-18484a84bb85',
    batch_reference: null,
    status: 'Confirming balance',
    status_code: 'BP104',
    transactions: [
        {
            transaction_id: 'KODZQPY',
            status: 'Pending',
            status_code: 'TP101',
            request_reference_id: 'c4099f04-dd63-4a04-9ade-45848fb7221a',
            provider: 'MPESA-B2C',
            bank_code: null,
            name: 'Nova Client',
            account: '254723551116',
            account_type: null,
            account_reference: null,
            provider_reference: null,
            provider_account_name: null,
            amount: '10.00',
            charge: '15.00',
            narrative: 'Nova WiFi Withdrawal',
            file_id: 'YGWRM70',
            currency: 'KES',
            created_at: '2025-04-27T17:21:14.696046+03:00',
            updated_at: '2025-04-27T17:21:14.709270+03:00'
        }
    ],
    actual_charges: '0.0',
    paid_amount: '0.0',
    failed_amount: 0,
    wallet: {
        wallet_id: 'YM67WG0',
        label: 'default',
        can_disburse: false,
        currency: 'KES',
        wallet_type: 'SETTLEMENT',
        current_balance: '26.58',
        available_balance: '26.58',
        updated_at: '2025-04-27T16:30:37.071451+03:00'
    },
    charge_estimate: '15.00',
    total_amount_estimate: '25.00',
    total_amount: '10.00',
    transactions_count: 1,
    created_at: '2025-04-27T17:21:14.574810+03:00',
    updated_at: '2025-04-27T17:21:14.877008+03:00',
    challenge: 'Sss333123kyan'
}

const Intasend_withdrawal_callback2 = {
    file_id: 'YGWRM70',
    tracking_id: 'a6bf52b4-81db-4e3a-8fd2-18484a84bb85',
    batch_reference: null,
    status: 'Preview and approve',
    status_code: 'BP103',
    transactions: [
        {
            transaction_id: 'KODZQPY',
            status: 'Pending',
            status_code: 'TP101',
            request_reference_id: 'c4099f04-dd63-4a04-9ade-45848fb7221a',
            provider: 'MPESA-B2C',
            bank_code: null,
            name: 'Nova Client',
            account: '254723551116',
            account_type: null,
            account_reference: null,
            provider_reference: null,
            provider_account_name: null,
            amount: '10.00',
            charge: '15.00',
            narrative: 'Nova WiFi Withdrawal',
            file_id: 'YGWRM70',
            currency: 'KES',
            created_at: '2025-04-27T17:21:14.696046+03:00',
            updated_at: '2025-04-27T17:21:14.709270+03:00'
        }
    ],
    actual_charges: '0.0',
    paid_amount: '0.0',
    failed_amount: 0,
    wallet: {
        wallet_id: 'YM67WG0',
        label: 'default',
        can_disburse: false,
        currency: 'KES',
        wallet_type: 'SETTLEMENT',
        current_balance: '26.58',
        available_balance: '26.58',
        updated_at: '2025-04-27T16:30:37.071451+03:00'
    },
    charge_estimate: '15.00',
    total_amount_estimate: '25.00',
    total_amount: '10.00',
    transactions_count: 1,
    created_at: '2025-04-27T17:21:14.574810+03:00',
    updated_at: '2025-04-27T17:21:14.761877+03:00',
    challenge: 'Sss333123kyan'
}

const Intasend_withdrawal_callback3 = {
    file_id: 'YGWRM70',
    tracking_id: 'a6bf52b4-81db-4e3a-8fd2-18484a84bb85',
    batch_reference: null,
    status: 'Sending payment',
    status_code: 'BP109',
    transactions: [
        {
            transaction_id: 'KODZQPY',
            status: 'Pending',
            status_code: 'TP101',
            request_reference_id: 'c4099f04-dd63-4a04-9ade-45848fb7221a',
            provider: 'MPESA-B2C',
            bank_code: null,
            name: 'Nova Client',
            account: '254723551116',
            account_type: null,
            account_reference: null,
            provider_reference: null,
            provider_account_name: null,
            amount: '10.00',
            charge: '15.00',
            narrative: 'Nova WiFi Withdrawal',
            file_id: 'YGWRM70',
            currency: 'KES',
            created_at: '2025-04-27T17:21:14.696046+03:00',
            updated_at: '2025-04-27T17:21:14.709270+03:00'
        }
    ],
    actual_charges: '0.0',
    paid_amount: '0.0',
    failed_amount: 0,
    wallet: {
        wallet_id: 'YM67WG0',
        label: 'default',
        can_disburse: false,
        currency: 'KES',
        wallet_type: 'SETTLEMENT',
        current_balance: '26.58',
        available_balance: '26.58',
        updated_at: '2025-04-27T16:30:37.071451+03:00'
    },
    charge_estimate: '15.00',
    total_amount_estimate: '25.00',
    total_amount: '10.00',
    transactions_count: 1,
    created_at: '2025-04-27T17:21:14.574810+03:00',
    updated_at: '2025-04-27T17:21:15.046830+03:00',
    challenge: 'Sss333123kyan'
}

const Intasend_withdrawal_callback4 = {
    file_id: 'YGWRM70',
    tracking_id: 'a6bf52b4-81db-4e3a-8fd2-18484a84bb85',
    batch_reference: null,
    status: 'Preview and approve',
    status_code: 'BP103',
    transactions: [
        {
            transaction_id: 'KODZQPY',
            status: 'Pending',
            status_code: 'TP101',
            request_reference_id: 'c4099f04-dd63-4a04-9ade-45848fb7221a',
            provider: 'MPESA-B2C',
            bank_code: null,
            name: 'Nova Client',
            account: '254723551116',
            account_type: null,
            account_reference: null,
            provider_reference: null,
            provider_account_name: null,
            amount: '10.00',
            charge: '15.00',
            narrative: 'Nova WiFi Withdrawal',
            file_id: 'YGWRM70',
            currency: 'KES',
            created_at: '2025-04-27T17:21:14.696046+03:00',
            updated_at: '2025-04-27T17:21:14.709270+03:00'
        }
    ],
    actual_charges: '0.0',
    paid_amount: '0.0',
    failed_amount: 0,
    wallet: {
        wallet_id: 'YM67WG0',
        label: 'default',
        can_disburse: false,
        currency: 'KES',
        wallet_type: 'SETTLEMENT',
        current_balance: '26.58',
        available_balance: '26.58',
        updated_at: '2025-04-27T16:30:37.071451+03:00'
    },
    charge_estimate: '15.00',
    total_amount_estimate: '25.00',
    total_amount: '10.00',
    transactions_count: 1,
    created_at: '2025-04-27T17:21:14.574810+03:00',
    updated_at: '2025-04-27T17:21:14.761877+03:00',
    challenge: 'Sss333123kyan'
}

const Intasend_withdrawal_callback5 = {
    file_id: 'YGWRM70',
    tracking_id: 'a6bf52b4-81db-4e3a-8fd2-18484a84bb85',
    batch_reference: null,
    status: 'Confirming balance',
    status_code: 'BP104',
    transactions: [
        {
            transaction_id: 'KODZQPY',
            status: 'Pending',
            status_code: 'TP101',
            request_reference_id: 'c4099f04-dd63-4a04-9ade-45848fb7221a',
            provider: 'MPESA-B2C',
            bank_code: null,
            name: 'Nova Client',
            account: '254723551116',
            account_type: null,
            account_reference: null,
            provider_reference: null,
            provider_account_name: null,
            amount: '10.00',
            charge: '15.00',
            narrative: 'Nova WiFi Withdrawal',
            file_id: 'YGWRM70',
            currency: 'KES',
            created_at: '2025-04-27T17:21:14.696046+03:00',
            updated_at: '2025-04-27T17:21:14.709270+03:00'
        }
    ],
    actual_charges: '0.0',
    paid_amount: '0.0',
    failed_amount: 0,
    wallet: {
        wallet_id: 'YM67WG0',
        label: 'default',
        can_disburse: false,
        currency: 'KES',
        wallet_type: 'SETTLEMENT',
        current_balance: '26.58',
        available_balance: '26.58',
        updated_at: '2025-04-27T16:30:37.071451+03:00'
    },
    charge_estimate: '15.00',
    total_amount_estimate: '25.00',
    total_amount: '10.00',
    transactions_count: 1,
    created_at: '2025-04-27T17:21:14.574810+03:00',
    updated_at: '2025-04-27T17:21:14.877008+03:00',
    challenge: 'Sss333123kyan'
}

const Intasend_withdrawal_callback6 = {
    file_id: 'YGWRM70',
    tracking_id: 'a6bf52b4-81db-4e3a-8fd2-18484a84bb85',
    batch_reference: null,
    status: 'Preview and approve',
    status_code: 'BP103',
    transactions: [
        {
            transaction_id: 'KODZQPY',
            status: 'Pending',
            status_code: 'TP101',
            request_reference_id: 'c4099f04-dd63-4a04-9ade-45848fb7221a',
            provider: 'MPESA-B2C',
            bank_code: null,
            name: 'Nova Client',
            account: '254723551116',
            account_type: null,
            account_reference: null,
            provider_reference: null,
            provider_account_name: null,
            amount: '10.00',
            charge: '15.00',
            narrative: 'Nova WiFi Withdrawal',
            file_id: 'YGWRM70',
            currency: 'KES',
            created_at: '2025-04-27T17:21:14.696046+03:00',
            updated_at: '2025-04-27T17:21:14.709270+03:00'
        }
    ],
    actual_charges: '0.0',
    paid_amount: '0.0',
    failed_amount: 0,
    wallet: {
        wallet_id: 'YM67WG0',
        label: 'default',
        can_disburse: false,
        currency: 'KES',
        wallet_type: 'SETTLEMENT',
        current_balance: '26.58',
        available_balance: '26.58',
        updated_at: '2025-04-27T16:30:37.071451+03:00'
    },
    charge_estimate: '15.00',
    total_amount_estimate: '25.00',
    total_amount: '10.00',
    transactions_count: 1,
    created_at: '2025-04-27T17:21:14.574810+03:00',
    updated_at: '2025-04-27T17:21:14.761877+03:00',
    challenge: 'Sss333123kyan'
}

const Intasend_withdrawal_callback7 = {
    file_id: 'YGWRM70',
    tracking_id: 'a6bf52b4-81db-4e3a-8fd2-18484a84bb85',
    batch_reference: null,
    status: 'Confirming balance',
    status_code: 'BP104',
    transactions: [
        {
            transaction_id: 'KODZQPY',
            status: 'Pending',
            status_code: 'TP101',
            request_reference_id: 'c4099f04-dd63-4a04-9ade-45848fb7221a',
            provider: 'MPESA-B2C',
            bank_code: null,
            name: 'Nova Client',
            account: '254723551116',
            account_type: null,
            account_reference: null,
            provider_reference: null,
            provider_account_name: null,
            amount: '10.00',
            charge: '15.00',
            narrative: 'Nova WiFi Withdrawal',
            file_id: 'YGWRM70',
            currency: 'KES',
            created_at: '2025-04-27T17:21:14.696046+03:00',
            updated_at: '2025-04-27T17:21:14.709270+03:00'
        }
    ],
    actual_charges: '0.0',
    paid_amount: '0.0',
    failed_amount: 0,
    wallet: {
        wallet_id: 'YM67WG0',
        label: 'default',
        can_disburse: false,
        currency: 'KES',
        wallet_type: 'SETTLEMENT',
        current_balance: '26.58',
        available_balance: '26.58',
        updated_at: '2025-04-27T16:30:37.071451+03:00'
    },
    charge_estimate: '15.00',
    total_amount_estimate: '25.00',
    total_amount: '10.00',
    transactions_count: 1,
    created_at: '2025-04-27T17:21:14.574810+03:00',
    updated_at: '2025-04-27T17:21:14.877008+03:00',
    challenge: 'Sss333123kyan'
}

const Intasend_withdrawal_callback8 = {
    file_id: 'YGWRM70',
    tracking_id: 'a6bf52b4-81db-4e3a-8fd2-18484a84bb85',
    batch_reference: null,
    status: 'Processing payment',
    status_code: 'BP110',
    transactions: [
        {
            transaction_id: 'KODZQPY',
            status: 'Pending',
            status_code: 'TP101',
            request_reference_id: 'c4099f04-dd63-4a04-9ade-45848fb7221a',
            provider: 'MPESA-B2C',
            bank_code: null,
            name: 'Nova Client',
            account: '254723551116',
            account_type: null,
            account_reference: null,
            provider_reference: null,
            provider_account_name: null,
            amount: '10.00',
            charge: '15.00',
            narrative: 'Nova WiFi Withdrawal',
            file_id: 'YGWRM70',
            currency: 'KES',
            created_at: '2025-04-27T17:21:14.696046+03:00',
            updated_at: '2025-04-27T17:21:14.709270+03:00'
        }
    ],
    actual_charges: '0.0',
    paid_amount: '0.0',
    failed_amount: 0,
    wallet: {
        wallet_id: 'YM67WG0',
        label: 'default',
        can_disburse: false,
        currency: 'KES',
        wallet_type: 'SETTLEMENT',
        current_balance: '26.58',
        available_balance: '1.58',
        updated_at: '2025-04-27T16:30:37.071451+03:00'
    },
    charge_estimate: '15.00',
    total_amount_estimate: '25.00',
    total_amount: '10.00',
    transactions_count: 1,
    created_at: '2025-04-27T17:21:14.574810+03:00',
    updated_at: '2025-04-27T17:21:15.206607+03:00',
    challenge: 'Sss333123kyan'
}

const Intasend_withdrawal_callback9 = {
    file_id: 'YGWRM70',
    tracking_id: 'a6bf52b4-81db-4e3a-8fd2-18484a84bb85',
    batch_reference: null,
    status: 'Completed',
    status_code: 'BC100',
    transactions: [
        {
            transaction_id: 'KODZQPY',
            status: 'Successful',
            status_code: 'TS100',
            request_reference_id: 'c4099f04-dd63-4a04-9ade-45848fb7221a',
            provider: 'MPESA-B2C',
            bank_code: null,
            name: 'Nova Client',
            account: '254723551116',
            account_type: null,
            account_reference: null,
            provider_reference: 'TDR1FVCVWZ',
            provider_account_name: null,
            amount: '10.00',
            charge: '15.00',
            narrative: 'Nova WiFi Withdrawal',
            file_id: 'YGWRM70',
            currency: 'KES',
            created_at: '2025-04-27T17:21:14.696046+03:00',
            updated_at: '2025-04-27T17:21:31.414880+03:00'
        }
    ],
    actual_charges: '15.00',
    paid_amount: '10.00',
    failed_amount: 0,
    wallet: {
        wallet_id: 'YM67WG0',
        label: 'default',
        can_disburse: false,
        currency: 'KES',
        wallet_type: 'SETTLEMENT',
        current_balance: '1.58',
        available_balance: '1.58',
        updated_at: '2025-04-27T17:21:15.182144+03:00'
    },
    charge_estimate: '15.00',
    total_amount_estimate: '25.00',
    total_amount: '10.00',
    transactions_count: 1,
    created_at: '2025-04-27T17:21:14.574810+03:00',
    updated_at: '2025-04-27T17:22:00.084685+03:00',
    challenge: 'Sss333123kyan'
}