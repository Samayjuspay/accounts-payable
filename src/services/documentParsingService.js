import { toast } from 'sonner';

const SUPPORTED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv', 'message/rfc822', 'application/vnd.ms-outlook'];
const MAX_SIZE = 10 * 1024 * 1024;

const mockVendorData = {
  name: 'ErgoFit Solutions',
  contactPerson: 'Amit Gupta',
  email: 'amit@ergofit.in',
  phone: '+91-9876543210',
  address: '123, Tech Park, Sector 62, Noida, UP 201301'
};

const mockItems = [
  {
    name: 'Ergonomic Chair Model EF-2000',
    description: 'High-back mesh chair with lumbar support',
    quantity: 10,
    unitPrice: 3200,
    total: 32000,
    confidence: 92
  },
  {
    name: 'Standing Desk Pro 60',
    description: 'Electric height-adjustable desk with memory presets',
    quantity: 5,
    unitPrice: 18500,
    total: 92500,
    confidence: 88
  },
  {
    name: 'Monitor Arm Dual Mount',
    description: 'Adjustable dual monitor arm with cable management',
    quantity: 15,
    unitPrice: 1200,
    total: 18000,
    confidence: 85
  }
];

const mockFinancials = {
  subtotal: 142500,
  tax: 28500,
  total: 171000
};

const mockDates = {
  quoteNumber: 'Q-2026-0042',
  quoteDate: '2026-03-15',
  validUntil: '2026-04-15',
  paymentTerms: 'Net 30',
  deliveryTime: '7-10 business days',
  specialNotes: 'Prices valid for 30 days. Bulk orders may qualify for additional discount.'
};

const mockConfidence = {
  vendorName: 95,
  contactPerson: 88,
  email: 92,
  phone: 85,
  items: 90,
  total: 98,
  validUntil: 85,
  paymentTerms: 78,
  deliveryTime: 72
};

const calculateOverallConfidence = (confidence) => {
  const values = Object.values(confidence);
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round(sum / values.length);
};

export const documentParsingService = {
  validateFile(file) {
    if (!file) {
      return { valid: false, error: 'No file selected' };
    }

    if (file.size > MAX_SIZE) {
      return { valid: false, error: `File too large. Maximum size is ${MAX_SIZE / 1024 / 1024}MB.` };
    }

    if (!SUPPORTED_TYPES.includes(file.type)) {
      return { valid: false, error: 'Unsupported file type. Please upload PDF, Excel, or Email.' };
    }

    return { valid: true };
  },

  async parseQuoteDocument(fileUrl, fileType) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Processing is taking longer than expected. Please try again.'));
      }, 60000);

      setTimeout(() => {
        clearTimeout(timeout);
        
        const success = Math.random() > 0.1;
        
        if (success) {
          const overallConfidence = calculateOverallConfidence(mockConfidence);
          const data = {
            vendor: mockVendorData,
            items: mockItems,
            ...mockFinancials,
            ...mockDates,
            confidence: mockConfidence,
            overallConfidence
          };
          resolve(data);
        } else {
          reject(new Error('Unable to parse quote. You can still fill the form manually.'));
        }
      }, 15000);
    });
  },

  async uploadToS3(file) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Upload failed. Please try again.'));
      }, 30000);

      setTimeout(() => {
        clearTimeout(timeout);
        const mockUrl = `https://s3.amazonaws.com/quotes/${Date.now()}/${file.name}`;
        resolve(mockUrl);
      }, 5000);
    });
  },

  async processDocument(file) {
    try {
      const validation = this.validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const fileUrl = await this.uploadToS3(file);
      const extractedData = await this.parseQuoteDocument(fileUrl, file.type);
      
      return {
        success: true,
        data: extractedData,
        fileUrl,
        fileName: file.name
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};