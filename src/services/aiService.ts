import { 
  FullFormPredictions, 
  Predictions,
} from '../types/ai-predictions.types';

interface PredictFieldsRequest {
  changedField: string;
  value: string;
  currentFormData: Record<string, unknown>;
  fullContext?: boolean;
}

interface PredictBudgetRequest {
  items: Array<{ name: string; quantity: number; unitPrice?: number }>;
  category: string;
  department: string;
}

interface BudgetPrediction {
  min: number;
  max: number;
  average: number;
  recommended: number;
  sampleSize: number;
}

interface RecommendedVendor {
  id: string;
  name: string;
  usageCount: number;
  avgRating: number;
  onTimeRate: number;
  isRecommended: boolean;
}

// Enhanced mock data for full form predictions
const MOCK_FULL_PREDICTIONS: Record<string, FullFormPredictions> = {
  'laptop': {
    basicInfo: {
      title: 'Laptops for Engineering Team - Q1 2026',
      department: 'Engineering',
      category: 'Hardware',
      urgency: 'Medium',
      justification: 'New hires joining in Q1 need development machines.',
      confidence: 0.92,
    },
    items: [
      {
        name: 'MacBook Pro 16"',
        description: 'M3 Pro chip, 36GB RAM, 512GB SSD',
        quantity: 5,
        unitPrice: 249900,
        unit: 'Piece',
        total: 1249500,
        specifications: 'M3 Pro 12-core CPU, 18-core GPU',
        source: 'Similar to PR-2026-015',
        confidence: 0.88,
      },
    ],
    vendor: {
      selectedVendors: ['Apple India', 'Amazon Business'],
      recommendedVendor: 'Apple India',
      reason: 'Used 8x for engineering laptops in last 12 months',
      rfqMode: false,
      confidence: 0.79,
    },
    budget: {
      estimatedTotal: 1272000,
      budgetSource: 'Engineering Equipment Budget 2026',
      costCenter: 'ENG-EQP-001',
      breakdown: {
        subtotal: 1272000,
        tax: 228960,
        grandTotal: 1500960,
      },
      confidence: 0.82,
    },
    delivery: {
      address: 'Bangalore Office, Embassy Tech Village, 2nd Floor',
      contactPerson: 'Arun Kumar',
      contactPhone: '+91-9876543210',
      shippingMethod: 'Express',
      installationRequired: true,
      specialInstructions: 'Deliver during office hours (10 AM - 5 PM)',
      source: 'Default Bangalore office address',
      confidence: 0.95,
    },
    attachments: {
      suggestedAttachments: [
        {
          name: 'Apple_Bulk_Order_Quote_Jan2026.pdf',
          url: 'https://storage.company.com/quotes/apple-jan2026.pdf',
          type: 'vendor_quote',
          fromPR: 'PR-2026-015',
          relevance: 'Same vendor, similar laptop specs',
        },
      ],
      confidence: 0.75,
    },
    overallConfidence: 0.86,
    sourceAnalysis: {
      matchedPRs: ['PR-2026-015', 'PR-2025-089', 'PR-2025-042'],
      patternDetected: 'Engineering laptop procurement for new hires',
      similarityScore: 0.91,
    },
  },
  
  'chair': {
    basicInfo: {
      title: '5 Chairs and Tables for Mumbai Office',
      department: 'Operations',
      category: 'Furniture & Fixtures',
      urgency: 'Medium',
      justification: 'Office furniture for new Mumbai team expansion.',
      confidence: 0.89,
    },
    items: [
      {
        name: 'Ergonomic Office Chair',
        description: 'High-back mesh chair with lumbar support',
        quantity: 5,
        unitPrice: 8500,
        unit: 'Piece',
        total: 42500,
        specifications: 'Adjustable height, mesh back, lumbar support',
        source: 'Similar to PR-2026-042',
        confidence: 0.88,
      },
      {
        name: 'Office Desk Table',
        description: 'L-shaped desk with cable management',
        quantity: 5,
        unitPrice: 12000,
        unit: 'Piece',
        total: 60000,
        specifications: '140cm x 70cm, engineered wood',
        source: 'Similar to PR-2026-042',
        confidence: 0.85,
      },
    ],
    vendor: {
      selectedVendors: ['ErgoFit Solutions', 'OfficeMax India'],
      recommendedVendor: 'ErgoFit Solutions',
      reason: 'Used 3x for furniture in last 6 months, 4.8⭐ rating',
      rfqMode: true,
      confidence: 0.79,
    },
    budget: {
      estimatedTotal: 102500,
      budgetSource: 'Operations Expansion Budget 2026',
      costCenter: 'OPS-MUM-001',
      breakdown: {
        subtotal: 102500,
        tax: 18450,
        grandTotal: 120950,
      },
      confidence: 0.82,
    },
    delivery: {
      address: 'Mumbai Office, Bandra Kurla Complex, 5th Floor, Mumbai - 400051',
      contactPerson: 'Rahul Sharma',
      contactPhone: '+91-9876543210',
      shippingMethod: 'Standard',
      installationRequired: true,
      specialInstructions: 'Deliver during office hours (9 AM - 6 PM)',
      source: 'Default Mumbai office address',
      confidence: 0.95,
    },
    attachments: {
      suggestedAttachments: [
        {
          name: 'ErgoFit_Furniture_Quote_Dec2025.pdf',
          url: 'https://storage.company.com/quotes/ergofit-dec2025.pdf',
          type: 'vendor_quote',
          fromPR: 'PR-2026-042',
          relevance: 'Similar furniture purchase',
        },
      ],
      confidence: 0.75,
    },
    overallConfidence: 0.86,
    sourceAnalysis: {
      matchedPRs: ['PR-2026-042', 'PR-2025-156', 'PR-2025-089'],
      patternDetected: 'Office furniture for new location setup',
      similarityScore: 0.91,
    },
  },
};

// Simple predictions for backward compatibility
const MOCK_PREDICTIONS: Record<string, Predictions> = {
  'laptop': {
    department: 'IT',
    category: 'Hardware',
    vendor: 'Dell Technologies',
    estimatedBudget: 240000,
    confidence: {
      department: 0.92,
      category: 0.88,
      vendor: 0.75,
      budget: 0.68,
    },
  },
  'software': {
    department: 'Engineering',
    category: 'Software',
    vendor: 'Microsoft',
    estimatedBudget: 150000,
    confidence: {
      department: 0.85,
      category: 0.90,
      vendor: 0.80,
      budget: 0.72,
    },
  },
};

export const predictFields = async (request: PredictFieldsRequest): Promise<Predictions | null> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const value = request.value.toLowerCase();
    let prediction: Predictions | null = null;
    
    for (const [keyword, pred] of Object.entries(MOCK_PREDICTIONS)) {
      if (value.includes(keyword)) {
        prediction = pred;
        break;
      }
    }
    
    if (!prediction) {
      prediction = {
        department: 'IT',
        category: 'Services',
        vendor: 'Amazon Business',
        estimatedBudget: 50000,
        confidence: {
          department: 0.60,
          category: 0.55,
          vendor: 0.50,
          budget: 0.45,
        },
      };
    }
    
    return prediction;
  } catch (error) {
    console.error('Error predicting fields:', error);
    return null;
  }
};

export const predictFullForm = async (request: PredictFieldsRequest): Promise<FullFormPredictions | null> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const value = request.value.toLowerCase();
    let prediction: FullFormPredictions | null = null;
    
    for (const [keyword, pred] of Object.entries(MOCK_FULL_PREDICTIONS)) {
      if (value.includes(keyword)) {
        prediction = pred;
        break;
      }
    }
    
    if (!prediction) {
      prediction = {
        basicInfo: {
          title: request.value,
          department: 'Operations',
          category: 'General',
          urgency: 'Medium',
          justification: `Purchase request for ${request.value}`,
          confidence: 0.60,
        },
        items: [],
        vendor: {
          selectedVendors: [],
          recommendedVendor: '',
          reason: '',
          rfqMode: false,
          confidence: 0.50,
        },
        budget: {
          estimatedTotal: 0,
          budgetSource: '',
          costCenter: '',
          breakdown: {
            subtotal: 0,
            tax: 0,
            grandTotal: 0,
          },
          confidence: 0.50,
        },
        delivery: {
          address: '',
          contactPerson: '',
          contactPhone: '',
          shippingMethod: 'Standard',
          installationRequired: false,
          specialInstructions: '',
          source: '',
          confidence: 0.50,
        },
        attachments: {
          suggestedAttachments: [],
          confidence: 0.50,
        },
        overallConfidence: 0.55,
        sourceAnalysis: {
          matchedPRs: [],
          patternDetected: 'New purchase request',
          similarityScore: 0.50,
        },
      };
    }
    
    return prediction;
  } catch (error) {
    console.error('Error predicting full form:', error);
    return null;
  }
};

export const predictBudget = async (request: PredictBudgetRequest): Promise<BudgetPrediction> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const baseAmount = request.items.reduce((sum, item) => {
      return sum + (item.quantity * (item.unitPrice || 1000));
    }, 0);
    
    return {
      min: Math.round(baseAmount * 0.8),
      max: Math.round(baseAmount * 1.2),
      average: baseAmount,
      recommended: Math.round(baseAmount * 1.05),
      sampleSize: Math.floor(Math.random() * 20) + 5,
    };
  } catch (error) {
    console.error('Error predicting budget:', error);
    throw error;
  }
};

export const getRecommendedVendors = async (
  category: string,
  department: string
): Promise<RecommendedVendor[]> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return [
      {
        id: '1',
        name: 'Dell Technologies',
        usageCount: 15,
        avgRating: 4.8,
        onTimeRate: 95,
        isRecommended: true,
      },
      {
        id: '2',
        name: 'HP Enterprise',
        usageCount: 12,
        avgRating: 4.6,
        onTimeRate: 92,
        isRecommended: false,
      },
      {
        id: '3',
        name: 'Lenovo Business',
        usageCount: 8,
        avgRating: 4.5,
        onTimeRate: 88,
        isRecommended: false,
      },
    ];
  } catch (error) {
    console.error('Error fetching recommended vendors:', error);
    return [];
  }
};

export const getTitleSuggestions = async (
  query: string,
  userId: string
): Promise<Array<{ title: string; source: 'history' | 'team' | 'ai' }>> => {
  try {
    if (query.length < 3) return [];
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    return [
      { title: `${query} - Annual Renewal`, source: 'history' },
      { title: `${query} for Engineering Team`, source: 'team' },
      { title: `Enterprise ${query} Solution`, source: 'ai' },
      { title: `${query} - Q1 2026`, source: 'history' },
      { title: `Premium ${query} Package`, source: 'ai' },
    ];
  } catch (error) {
    console.error('Error fetching title suggestions:', error);
    return [];
  }
};