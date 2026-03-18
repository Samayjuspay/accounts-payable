export interface PredictedBasicInfo {
  title: string;
  department: string;
  category: string;
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  justification: string;
  confidence: number;
}

export interface PredictedItem {
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  total: number;
  specifications: string;
  source: string;
  confidence: number;
}

export interface PredictedVendor {
  selectedVendors: string[];
  recommendedVendor: string;
  reason: string;
  rfqMode: boolean;
  confidence: number;
}

export interface PredictedBudget {
  estimatedTotal: number;
  budgetSource: string;
  costCenter: string;
  breakdown: {
    subtotal: number;
    tax: number;
    grandTotal: number;
  };
  confidence: number;
}

export interface PredictedDelivery {
  address: string;
  contactPerson: string;
  contactPhone: string;
  shippingMethod: string;
  installationRequired: boolean;
  specialInstructions: string;
  source: string;
  confidence: number;
}

export interface SuggestedAttachment {
  name: string;
  url: string;
  type: string;
  fromPR: string;
  relevance: string;
}

export interface PredictedAttachments {
  suggestedAttachments: SuggestedAttachment[];
  confidence: number;
}

export interface SourceAnalysis {
  matchedPRs: string[];
  patternDetected: string;
  similarityScore: number;
}

export interface FullFormPredictions {
  basicInfo: PredictedBasicInfo;
  items: PredictedItem[];
  vendor: PredictedVendor;
  budget: PredictedBudget;
  delivery: PredictedDelivery;
  attachments: PredictedAttachments;
  overallConfidence: number;
  sourceAnalysis: SourceAnalysis;
}

export interface AIGeneratedField {
  value: unknown;
  isAIGenerated: boolean;
  sourcePR?: string;
  confidence?: number;
  timestamp: number;
}

// Legacy simple predictions for backward compatibility
export interface Predictions {
  department?: string;
  category?: string;
  vendor?: string;
  estimatedBudget?: number;
  confidence?: {
    department: number;
    category: number;
    vendor: number;
    budget: number;
  };
}

// Legacy simple predictions for backward compatibility
export interface Predictions {
  department?: string;
  category?: string;
  vendor?: string;
  estimatedBudget?: number;
  confidence?: {
    department: number;
    category: number;
    vendor: number;
    budget: number;
  };
}