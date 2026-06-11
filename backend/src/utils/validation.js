function validateCustomerRecord(record) {
  const errors = [];

  if (!record.email && !record.phone && !record.external_customer_id) {
    errors.push("Record must have email, phone, or external_customer_id");
  }

  if (record.email && !isValidEmail(record.email)) {
    errors.push(`Invalid email: ${record.email}`);
  }

  if (record.phone && record.phone.length < 10) {
    errors.push(`Phone too short: ${record.phone}`);
  }

  return { isValid: errors.length === 0, errors };
}

function validateOrderRecord(record) {
  const errors = [];

  if (!record.external_order_id) {
    errors.push("external_order_id is required");
  }

  if (!record.external_customer_id) {
    errors.push("external_customer_id is required");
  }

  if (!record.amount || isNaN(parseFloat(record.amount))) {
    errors.push("amount must be a valid number");
  }

  if (!record.order_date) {
    errors.push("order_date is required");
  } else if (isNaN(Date.parse(record.order_date))) {
    errors.push(`Invalid order_date: ${record.order_date}`);
  }

  if (record.currency && record.currency.length !== 3) {
    errors.push(`Currency should be 3-letter code: ${record.currency}`);
  }

  return { isValid: errors.length === 0, errors };
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

module.exports = { validateCustomerRecord, validateOrderRecord };
