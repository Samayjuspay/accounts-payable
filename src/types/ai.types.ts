export type AssistantIntent =
  | 'create-pr'
  | 'approvals'
  | 'vendors'
  | 'tasks'
  | 'quote-comparison'
  | 'bulk-setup'
  | 'budget'
  | 'unknown';

export type MessageAccent = 'default' | 'info' | 'success' | 'warning' | 'danger';

export interface ChatAction {
  id: string;
  label: string;
  primary?: boolean;
}

export interface ChatStat {
  label: string;
  value: string;
  accent?: MessageAccent;
}

export interface ChatSection {
  title: string;
  text?: string;
  bullets?: string[];
  accent?: MessageAccent;
}

export interface ChatCard {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  accent?: MessageAccent;
  metadata?: { label: string; value: string }[];
  bullets?: string[];
  actions?: ChatAction[];
}

export interface ChatMessageRecord {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  intent?: AssistantIntent;
  sections?: ChatSection[];
  stats?: ChatStat[];
  cards?: ChatCard[];
  actions?: ChatAction[];
}

export interface AssistantUserContext {
  name: string;
  department: string;
  role: string;
  location: string;
  defaultBudgetName: string;
  approvalLimit: number;
  manager: string;
  financeApprover: string;
}

export interface HistoricalOrderInsight {
  id: string;
  vendor: string;
  item: string;
  orderedMonthsAgo: number;
  quantity: number;
  unitPrice: number;
  rating: number;
  note: string;
}

export interface ApprovalDigestItem {
  id: string;
  title: string;
  requester: string;
  department: string;
  amount: number;
  vendor: string;
  dueLabel: string;
  urgency: 'Urgent' | 'Due Today' | 'This Week';
  justification: string;
}

export interface VendorRecommendation {
  id: string;
  name: string;
  rating: number;
  specialization: string;
  previousOrders: number;
  lastOrderLabel?: string;
  averageDelivery: string;
  priceRange: string;
  paymentTerms: string;
  location: string;
  highlight: string;
}

export interface TaskDigestItem {
  id: string;
  title: string;
  priority: 'Urgent' | 'This Week' | 'Upcoming';
  summary: string;
  dueLabel: string;
  amountImpact?: string;
  ctaPrimary: string;
  ctaSecondary?: string;
}

export interface QuoteComparisonOption {
  id: string;
  vendor: string;
  unitPrice: number;
  totalPrice: number;
  warranty: string;
  delivery: string;
  paymentTerms: string;
  highlight: string;
  recommendationTag: string;
}

export interface BudgetCategorySnapshot {
  name: string;
  spent: number;
  total: number;
  available: number;
  status: 'Healthy' | 'Running Low' | 'Critical' | 'Excellent';
}

export interface BudgetOverviewSnapshot {
  department: string;
  monthLabel: string;
  totalBudget: number;
  spentToDate: number;
  committed: number;
  available: number;
  trendingNote: string;
  forecastNote: string;
  categories: BudgetCategorySnapshot[];
  recommendations: string[];
}

export interface BackendEndpointSpec {
  method: 'GET' | 'POST' | 'PATCH';
  path: string;
  purpose: string;
}

export interface PRDraftState {
  itemName?: string;
  normalizedItemName?: string;
  quantity?: number;
  location?: string;
  unitPrice?: number;
  requiredBy?: string;
  requirements?: string[];
  vendorId?: string;
  vendorName?: string;
  category?: string;
  title?: string;
  deliveryAddress?: string;
}

export interface BulkSetupItem {
  name: string;
  quantity: number;
  category: 'Furniture' | 'IT Equipment' | 'Pantry';
}

export interface BulkSetupState {
  location: string;
  requiredBy?: string;
  items: BulkSetupItem[];
  autofilled?: boolean;
}

export interface ConversationState {
  activeIntent: AssistantIntent | null;
  prDraft?: PRDraftState;
  vendorSearchTerm?: string;
  selectedVendorIds?: string[];
  selectedApprovalIds?: string[];
  bulkSetup?: BulkSetupState;
  quoteWorkspaceReady?: boolean;
}

export interface AIConversationPRPayload {
  title: string;
  vendor: string;
  amount: number;
  department: string;
  category: string;
  dueDate: string;
}
