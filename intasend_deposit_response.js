const { token } = req.body;
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

const stkpusresp = {
  id: 'dbd71f91-02df-449c-a28f-981e5fb080ec',
  invoice: {
    invoice_id: 'KNDELM3',
    state: 'PENDING',
    provider: 'M-PESA',
    charges: 0,
    net_amount: '20.00',
    currency: 'KES',
    value: 20,
    account: '254723551116',
    api_ref: 'Nova WiFi',
    mpesa_reference: null,
    host: '41.89.164.2',
    card_info: { bin_country: null, card_type: null },
    retry_count: 0,
    failed_reason: null,
    failed_code: null,
    failed_code_link: null,
    created_at: '2025-04-26T15:38:25.438852+03:00',
    updated_at: '2025-04-26T15:38:25.448094+03:00'
  },
  customer: {
    customer_id: 'KORM43K',
    phone_number: '254723551116',
    email: null,
    first_name: null,
    last_name: null,
    country: null,
    zipcode: null,
    provider: 'M-PESA',
    created_at: '2024-05-09T11:37:33.726413+03:00',
    updated_at: '2024-07-11T09:45:13.776474+03:00'
  },
  payment_link: null,
  customer_comment: null,
  refundable: false,
  created_at: '2025-04-26T15:38:25.480595+03:00',
  updated_at: '2025-04-26T15:38:25.480612+03:00'
}

const Intasend_deposit_callback = {
  invoice_id: '0LV95J9',
  state: 'PENDING',
  provider: 'M-PESA',
  charges: '0.00',
  net_amount: '20.00',
  currency: 'KES',
  value: '20.00',
  account: '254723551116',
  api_ref: 'Nova WiFi',
  mpesa_reference: null,
  host: '41.89.164.2',
  card_info: { bin_country: null, card_type: null },
  retry_count: 0,
  failed_reason: null,
  failed_code: null,
  failed_code_link: null,
  created_at: '2025-04-26T16:00:18.310850+03:00',
  updated_at: '2025-04-26T16:00:18.318955+03:00',
  challenge: 'Sss333123kyan'
}

const Intasend_deposit_callback2 = {
  invoice_id: '0LV95J9',
  state: 'PROCESSING',
  provider: 'M-PESA',
  charges: '0.00',
  net_amount: '20.00',
  currency: 'KES',
  value: '20.00',
  account: '254723551116',
  api_ref: 'Nova WiFi',
  mpesa_reference: null,
  host: '41.89.164.2',
  card_info: { bin_country: null, card_type: null },
  retry_count: 0,
  failed_reason: null,
  failed_code: null,
  failed_code_link: null,
  created_at: '2025-04-26T16:00:18.310850+03:00',
  updated_at: '2025-04-26T16:00:20.037204+03:00',
  challenge: 'Sss333123kyan'
}

const Intasend_deposit_callback3 = {
  invoice_id: '0LV95J9',
  state: 'FAILED',
  provider: 'M-PESA',
  charges: '0.00',
  net_amount: '20.00',
  currency: 'KES',
  value: '20.00',
  account: '254723551116',
  api_ref: 'Nova WiFi',
  mpesa_reference: null,
  host: '41.89.164.2',
  card_info: { bin_country: null, card_type: null },
  retry_count: 0,
  failed_reason: 'Request cancelled by user',
  failed_code: '-1',
  failed_code_link: null,
  created_at: '2025-04-26T16:00:18.310850+03:00',
  updated_at: '2025-04-26T16:00:38.216645+03:00',
  challenge: 'Sss333123kyan'
}

const Intasend_deposit_callback4 = {
  invoice_id: '0LV95J9',
  state: 'COMPLETE',
  provider: 'M-PESA',
  charges: '0.00',
  net_amount: '5.00',
  currency: 'KES',
  value: '4.85',
  account: '254723551116',
  api_ref: 'Nova WiFi',
  mpesa_reference: "TDLE527E2G",
  host: '41.89.164.2',
  card_info: { bin_country: null, card_type: null },
  retry_count: 0,
  failed_reason: 'Request cancelled by user',
  failed_code: 0,
  failed_code_link: null,
  created_at: '2025-04-26T16:00:18.310850+03:00',
  updated_at: '2025-04-26T16:00:38.216645+03:00',
  challenge: 'Sss333123kyan'
}