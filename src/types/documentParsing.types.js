export const DocumentParsingTypes = {
  Vendor: {
    name: 'string',
    contactPerson: 'string',
    email: 'string',
    phone: 'string',
    address: 'string'
  },
  LineItem: {
    name: 'string',
    description: 'string',
    quantity: 'number',
    unitPrice: 'number',
    total: 'number',
    confidence: 'number'
  },
  Financials: {
    subtotal: 'number',
    tax: 'number',
    total: 'number'
  },
  Dates: {
    quoteNumber: 'string',
    quoteDate: 'string',
    validUntil: 'string',
    paymentTerms: 'string',
    deliveryTime: 'string',
    specialNotes: 'string'
  },
  Confidence: {
    vendorName: 'number',
    contactPerson: 'number',
    email: 'number',
    phone: 'number',
    items: 'number',
    total: 'number',
    validUntil: 'number',
    paymentTerms: 'number',
    deliveryTime: 'number'
  },
  ParsedDocument: {
    vendor: 'Vendor',
    items: 'LineItem[]',
    subtotal: 'number',
    tax: 'number',
    total: 'number',
    quoteNumber: 'string',
    quoteDate: 'string',
    validUntil: 'string',
    paymentTerms: 'string',
    deliveryTime: 'string',
    specialNotes: 'string',
    confidence: 'Confidence',
    overallConfidence: 'number'
  },
  FileUploadResult: {
    success: 'boolean',
    data: 'ParsedDocument',
    fileUrl: 'string',
    fileName: 'string',
    error: 'string'
  },
  FileValidation: {
    valid: 'boolean',
    error: 'string'
  }
};

export const ConfidenceLevels = {
  HIGH: { threshold: 80, color: 'green', label: 'High' },
  MEDIUM: { threshold: 60, color: 'yellow', label: 'Medium' },
  LOW: { threshold: 0, color: 'red', label: 'Low' }
};

export const getConfidenceLevel = (score) => {
  if (score >= ConfidenceLevels.HIGH.threshold) {
    return ConfidenceLevels.HIGH;
  } else if (score >= ConfidenceLevels.MEDIUM.threshold) {
    return ConfidenceLevels.MEDIUM;
  } else {
    return ConfidenceLevels.LOW;
  }
};

export const getConfidenceColor = (score) => {
  const level = getConfidenceLevel(score);
  return level.color;
};

export const getConfidenceLabel = (score) => {
  const level = getConfidenceLevel(score);
  return level.label;
};