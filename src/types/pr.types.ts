export type PRStatus = 'Draft' | 'Approval Pending' | 'Approved' | 'Rejected' | 'PO Created';

export interface LineItem {
  id: string;
  productName: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  taxRate: number;
  total: number;
  specifications?: string;
  sku?: string;
  category: string;
  expectedDelivery: string;
  // AI metadata
  _aiGenerated?: boolean;
  _sourcePR?: string;
  _confidence?: number;
}

export interface Vendor {
  id: string;
  name: string;
  rating: number;
  location: string;
  phone: string;
  email: string;
  paymentTerms: string;
  deliveryTime: string;
  category?: string;
}

export interface Budget {
  id: string;
  name: string;
  department: string;
  availableBalance: number;
  totalBudget: number;
  currency: string;
  // AI metadata
  aiBudgetSource?: string;
  aiCostCenter?: string;
}

export interface Address {
  building?: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface AIPredictedDelivery {
  address: string;
  contactPerson: string;
  contactPhone: string;
  shippingMethod: string;
  installationRequired: boolean;
  specialInstructions: string;
  source: string;
  confidence: number;
}

export interface Delivery {
  locationType: 'default' | 'saved' | 'new';
  address: Address;
  contact: {
    name: string;
    phone: string;
    email: string;
  };
  instructions?: string;
  shippingMethod: 'Standard' | 'Express' | 'Next day';
  installationRequired: boolean;
  trainingRequired: boolean;
  // AI metadata
  aiPredictedDelivery?: AIPredictedDelivery;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
  category: 'Vendor Quote' | 'Product Spec' | 'Approval Docs' | 'Comparison' | 'Other';
  description?: string;
}

export interface ApprovalStep {
  id: string;
  role: string;
  approver?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  timestamp?: string;
  type: 'Sequential' | 'Parallel';
}

export interface PurchaseRequest {
  id?: string;
  title: string;
  department: string;
  category: string;
  subCategory?: string;
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  businessJustification: string;
  requestedBy: string;
  requestDate: string;
  requiredByDate: string;
  items: LineItem[];
  vendorSelection: {
    mode: 'existing' | 'rfq' | 'new' | 'none';
    selectedVendorId?: string;
    rfqVendorIds?: string[];
    newVendorData?: Partial<Vendor>;
    // AI metadata
    aiPredictedVendors?: string[];
    aiRecommendedVendor?: string;
  };
  budget?: Budget;
  delivery?: Delivery;
  attachments: Attachment[];
  approvalChain: ApprovalStep[];
  status: PRStatus;
  totalAmount: number;
  termsAccepted: boolean;
}

export type PRFormData = PurchaseRequest;