import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { Resizable, ResizeDirection } from 're-resizable';
import { motion } from 'motion/react';
import {
  ArrowUp,
  Bell,
  ExternalLink,
  FileStack,
  FileText,
  Globe,
  Hash,
  Paperclip,
  Plus,
  Search,
  Settings,
  Sparkles,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import {
  ThemeProvider as BlendThemeProvider,
  Theme as BlendTheme,
  Button as BlendButton,
  ButtonType as BlendButtonType,
  ButtonSize as BlendButtonSize,
  ButtonSubType as BlendButtonSubType,
  SearchInput as BlendSearchInput,
  Card as BlendCard,
  CardVariant as BlendCardVariant,
} from '@juspay/blend-design-system';
import {
  AI_BACKEND_ENDPOINTS,
  AI_BUDGET_OVERVIEW,
  AI_HISTORICAL_ORDERS,
  AI_PENDING_APPROVALS,
  AI_QUOTE_COMPARISON,
  AI_TASKS,
  AI_USER_CONTEXT,
  AI_VENDOR_RECOMMENDATIONS,
} from '../constants/mockData';
import {
  AIConversationPRPayload,
  ChatAction,
  ChatCard,
  ChatMessageRecord,
  ConversationState,
  MessageAccent,
  PRDraftState,
} from '../types/ai.types';
import {
  detectIntent,
  formatCurrency,
  formatLongDate,
  mergePRDraft,
  parseBulkSetupItems,
  parseSelectionNumbers,
  REFERENCE_DATE,
  resolveDatePhrase,
} from '../utils/xyneAssistant';

interface XyneAIChatProps {
  isOpen: boolean;
  onClose: () => void;
  variant?: 'floating' | 'embedded';
  currentContext?: string;
  onCreatePurchaseRequests?: (requests: AIConversationPRPayload[]) => string[];
  onApprovePurchaseRequests?: (ids: string[]) => void;
  onOpenPurchaseRequest?: (id: string) => void;
  attentionRequest?: number;
}

interface TurnResult {
  messages: ChatMessageRecord[];
  nextState?: ConversationState;
  afterCommit?: () => void;
}

interface WindowViewport {
  width: number;
  height: number;
}

interface WindowSizeState {
  width: number;
  height: number;
}

interface WindowPositionState {
  x: number;
  y: number;
}

const HISTORY_KEY = 'xyne_chat_history_v3';
const STATE_KEY = 'xyne_chat_state_v3';
const WINDOW_POSITION_KEY = 'xyne-window-position-v4';
const WINDOW_SIZE_KEY = 'xyne-window-size-v4';
const WINDOW_MINIMIZED_KEY = 'xyne-window-minimized-v4';

const FLOATING_EDGE_GAP = 24;
const MIN_VISIBLE_WINDOW = 50;
const DESKTOP_DEFAULT_WIDTH = 420;
const DESKTOP_DEFAULT_HEIGHT = 580;
const TABLET_DEFAULT_WIDTH = 380;
const TABLET_DEFAULT_HEIGHT = 520;
const MIN_WIDTH = 380;
const MAX_WIDTH = 560;
const MIN_HEIGHT = 480;

const defaultConversationState: ConversationState = {
  activeIntent: null,
};

const accentClasses: Record<MessageAccent, string> = {
  default: 'border-zinc-200 bg-white text-zinc-900',
  info: 'border-blue-200 bg-blue-50/70 text-blue-950',
  success: 'border-emerald-200 bg-emerald-50/80 text-emerald-950',
  warning: 'border-amber-200 bg-amber-50/80 text-amber-950',
  danger: 'border-red-200 bg-red-50/80 text-red-950',
};

function getViewport(): WindowViewport {
  if (typeof window === 'undefined') {
    return { width: 1440, height: 900 };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

function getDefaultWindowSize(viewportWidth: number): WindowSizeState {
  if (viewportWidth <= 1024) {
    return { width: TABLET_DEFAULT_WIDTH, height: TABLET_DEFAULT_HEIGHT };
  }

  return { width: DESKTOP_DEFAULT_WIDTH, height: DESKTOP_DEFAULT_HEIGHT };
}

function getMaxHeight(viewport: WindowViewport) {
  return Math.max(MIN_HEIGHT, viewport.height - 48);
}

function clampWindowPosition(
  position: WindowPositionState,
  viewport: WindowViewport,
): WindowPositionState {
  return {
    x: Math.min(Math.max(position.x, 0), Math.max(0, viewport.width - MIN_VISIBLE_WINDOW)),
    y: Math.min(Math.max(position.y, 0), Math.max(0, viewport.height - MIN_VISIBLE_WINDOW)),
  };
}

function clampWindowSize(
  size: WindowSizeState,
  viewport: WindowViewport,
  position: WindowPositionState,
): WindowSizeState {
  return {
    width: Math.min(
      Math.max(size.width, MIN_WIDTH),
      Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, viewport.width - position.x)),
    ),
    height: Math.min(
      Math.max(size.height, MIN_HEIGHT),
      Math.max(MIN_HEIGHT, Math.min(getMaxHeight(viewport), viewport.height - position.y)),
    ),
  };
}

function getDefaultWindowPosition(
  size: WindowSizeState,
  viewport: WindowViewport,
): WindowPositionState {
  return clampWindowPosition(
    {
      x: viewport.width - size.width - FLOATING_EDGE_GAP,
      y: viewport.height - size.height - FLOATING_EDGE_GAP,
    },
    viewport,
  );
}

function parseStoredMessages(raw: string | null) {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ChatMessageRecord[];
  } catch (error) {
    console.error('Failed to parse chat history', error);
    return [];
  }
}

function parseStoredState(raw: string | null): ConversationState {
  if (!raw) return defaultConversationState;

  try {
    const parsed = JSON.parse(raw);
    return { ...defaultConversationState, ...(parsed as ConversationState) };
  } catch (error) {
    console.error('Failed to parse assistant state', error);
    return defaultConversationState;
  }
}

function parseStoredSize(raw: string | null, viewport: WindowViewport): WindowSizeState {
  const fallbackPosition = { x: FLOATING_EDGE_GAP, y: FLOATING_EDGE_GAP };

  if (!raw) {
    return clampWindowSize(getDefaultWindowSize(viewport.width), viewport, fallbackPosition);
  }

  try {
    const parsed = JSON.parse(raw) as Partial<WindowSizeState>;
    return clampWindowSize(
      {
        width: parsed.width ?? getDefaultWindowSize(viewport.width).width,
        height: parsed.height ?? getDefaultWindowSize(viewport.width).height,
      },
      viewport,
      fallbackPosition,
    );
  } catch (error) {
    console.error('Failed to parse window size', error);
    return clampWindowSize(getDefaultWindowSize(viewport.width), viewport, fallbackPosition);
  }
}

function parseStoredPosition(
  raw: string | null,
  size: WindowSizeState,
  viewport: WindowViewport,
): WindowPositionState {
  if (!raw) return getDefaultWindowPosition(size, viewport);

  try {
    const parsed = JSON.parse(raw) as Partial<WindowPositionState>;
    return clampWindowPosition(
      {
        x: parsed.x ?? getDefaultWindowPosition(size, viewport).x,
        y: parsed.y ?? getDefaultWindowPosition(size, viewport).y,
      },
      viewport,
    );
  } catch (error) {
    console.error('Failed to parse window position', error);
    return getDefaultWindowPosition(size, viewport);
  }
}

function parseStoredMinimized(raw: string | null) {
  if (!raw) return false;

  try {
    return Boolean(JSON.parse(raw));
  } catch (error) {
    console.error('Failed to parse minimized state', error);
    return false;
  }
}

function createMessage(
  role: 'user' | 'assistant',
  content: string,
  overrides: Partial<ChatMessageRecord> = {},
): ChatMessageRecord {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

function buildWelcomeMessage(): ChatMessageRecord {
  return createMessage('assistant', 'I can handle purchase requests, approvals, vendor discovery, tasks, and budget checks in one conversation.', {
    sections: [
      {
        title: 'What I can do right now',
        bullets: [
          'Create PRs from natural language and fill missing details.',
          'Approve pending requests and explain budget impact.',
          'Search vendors, request quotes, and compare responses.',
          'Surface urgent tasks, reminders, and budget risks.',
        ],
      },
    ],
    actions: [
      { id: 'starter-create-pr', label: 'Create new PR', primary: true },
      { id: 'starter-approvals', label: 'Check pending approvals' },
      { id: 'starter-vendors', label: 'Search vendors' },
      { id: 'starter-tasks', label: 'View my tasks' },
      { id: 'starter-budget', label: 'How much budget do I have left?' },
    ],
  });
}

function getSearchText(message: ChatMessageRecord) {
  const sectionText = message.sections
    ?.flatMap((section) => [section.title, section.text ?? '', ...(section.bullets ?? [])])
    .join(' ');
  const cardText = message.cards
    ?.flatMap((card) => [
      card.title,
      card.subtitle ?? '',
      ...(card.metadata ?? []).map((item) => `${item.label} ${item.value}`),
      ...(card.bullets ?? []),
    ])
    .join(' ');

  return `${message.content} ${sectionText ?? ''} ${cardText ?? ''}`.toLowerCase();
}

function buildDraftSummary(draft: PRDraftState) {
  const quantity = draft.quantity ?? 0;
  const unitPrice = draft.unitPrice ?? 0;
  const total = quantity * unitPrice;

  return [
    { label: 'Item', value: draft.itemName ?? 'TBD' },
    { label: 'Quantity', value: quantity ? `${quantity} units` : 'TBD' },
    { label: 'Unit Price', value: unitPrice ? formatCurrency(unitPrice) : 'TBD' },
    { label: 'Total', value: total ? formatCurrency(total) : 'TBD' },
    { label: 'Delivery', value: draft.location ?? AI_USER_CONTEXT.location },
    { label: 'Needed by', value: draft.requiredBy ? formatLongDate(draft.requiredBy) : 'TBD' },
    { label: 'Department', value: AI_USER_CONTEXT.department },
    { label: 'Category', value: draft.category ?? 'TBD' },
  ];
}

export const XyneAIChat: React.FC<XyneAIChatProps> = ({
  isOpen,
  onClose,
  variant = 'floating',
  currentContext,
  onCreatePurchaseRequests,
  onApprovePurchaseRequests,
  onOpenPurchaseRequest,
  attentionRequest,
}) => {
  const initialViewport = getViewport();
  const initialSize = parseStoredSize(localStorage.getItem(WINDOW_SIZE_KEY), initialViewport);

  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const [conversationState, setConversationState] = useState<ConversationState>(defaultConversationState);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [viewport, setViewport] = useState<WindowViewport>(initialViewport);
  const [isMobile, setIsMobile] = useState(initialViewport.width < 768);
  const [view, setView] = useState<'chat' | 'search' | 'settings'>('chat');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailedResponses, setDetailedResponses] = useState(true);
  const [showContext, setShowContext] = useState(Boolean(currentContext));
  const [windowSize, setWindowSize] = useState<WindowSizeState>(initialSize);
  const [windowPosition, setWindowPosition] = useState<WindowPositionState>(
    parseStoredPosition(localStorage.getItem(WINDOW_POSITION_KEY), initialSize, initialViewport),
  );
  const [isMinimized, setIsMinimized] = useState(parseStoredMinimized(localStorage.getItem(WINDOW_MINIMIZED_KEY)));
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isBumping, setIsBumping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const draggableNodeRef = useRef<HTMLDivElement>(null);
  const previousFocusedElementRef = useRef<HTMLElement | null>(null);
  const positionRef = useRef(windowPosition);
  const sizeRef = useRef(windowSize);
  const viewportRef = useRef(viewport);
  const resizeStartRef = useRef<{ position: WindowPositionState; size: WindowSizeState }>({
    position: windowPosition,
    size: windowSize,
  });

  useEffect(() => {
    positionRef.current = windowPosition;
  }, [windowPosition]);

  useEffect(() => {
    sizeRef.current = windowSize;
  }, [windowSize]);

  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

  useEffect(() => {
    const storedMessages = parseStoredMessages(localStorage.getItem(HISTORY_KEY));
    const storedState = parseStoredState(localStorage.getItem(STATE_KEY));

    if (storedMessages.length > 0) {
      setMessages(storedMessages);
      setConversationState(storedState);
      return;
    }

    setMessages([buildWelcomeMessage()]);
  }, []);

  useEffect(() => {
    previousFocusedElementRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    requestAnimationFrame(() => focusComposer());

    return () => {
      previousFocusedElementRef.current?.focus();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(STATE_KEY, JSON.stringify(conversationState));
  }, [conversationState]);

  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem(WINDOW_POSITION_KEY, JSON.stringify(windowPosition));
      localStorage.setItem(WINDOW_SIZE_KEY, JSON.stringify(windowSize));
      localStorage.setItem(WINDOW_MINIMIZED_KEY, JSON.stringify(isMinimized));
    }
  }, [windowPosition, windowSize, isMinimized, isMobile]);

  useEffect(() => {
    setShowContext(Boolean(currentContext));
  }, [currentContext]);

  useEffect(() => {
    const handleResize = () => {
      const nextViewport = getViewport();
      setViewport(nextViewport);
      const nextIsMobile = nextViewport.width < 768;
      setIsMobile(nextIsMobile);

      if (nextIsMobile) {
        setIsMinimized(false);
        return;
      }

      const clampedPosition = clampWindowPosition(positionRef.current, nextViewport);
      const clampedSize = clampWindowSize(sizeRef.current, nextViewport, clampedPosition);
      const adjustedPosition = clampWindowPosition(clampedPosition, nextViewport);

      setWindowPosition(adjustedPosition);
      setWindowSize(clampedSize);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, view]);

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        focusComposer();
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'm' && !isMobile && variant !== 'embedded') {
        event.preventDefault();
        setIsMinimized((value) => !value);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isMobile, onClose, variant]);

  useEffect(() => {
    if (variant === 'embedded') {
      setIsMinimized(false);
    }
  }, [variant]);

  useEffect(() => {
    if (!attentionRequest) return;

    setIsMinimized(false);
    setView('chat');
    setIsBumping(true);
    requestAnimationFrame(() => focusComposer());

    const timeout = window.setTimeout(() => setIsBumping(false), 450);
    return () => window.clearTimeout(timeout);
  }, [attentionRequest]);

  useEffect(() => {
    if (isMinimized || view !== 'chat') return;
    requestAnimationFrame(() => focusComposer());
  }, [isMinimized, view]);

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages.slice(-8);
    return messages.filter((message) => getSearchText(message).includes(searchQuery.toLowerCase()));
  }, [messages, searchQuery]);

  const isWelcomeState = useMemo(
    () =>
      messages.length === 1 &&
      messages[0].role === 'assistant' &&
      messages[0].actions?.some((action) => action.id === 'starter-create-pr'),
    [messages],
  );

  const latestTimestamp = formatTime(messages[messages.length - 1]?.timestamp ?? new Date().toISOString());
  const isEmbedded = variant === 'embedded';
  const isFloatingMode = !isMobile && !isEmbedded;
  const activeBounds = useMemo(
    () => ({
      left: 0,
      top: 0,
      right: Math.max(0, viewport.width - windowSize.width),
      bottom: Math.max(0, viewport.height - windowSize.height),
    }),
    [viewport.height, viewport.width, windowSize.height, windowSize.width],
  );

  const clearHistory = () => {
    const welcome = buildWelcomeMessage();
    setMessages([welcome]);
    setConversationState(defaultConversationState);
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem(STATE_KEY);
    setView('chat');
  };

  const focusComposer = () => {
    const inputElement = dialogRef.current?.querySelector('textarea, input');
    if (inputElement instanceof HTMLElement) {
      inputElement.focus();
    }
  };

  function formatTime(timestamp: string) {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const buildCreatePRFollowUp = (draft: PRDraftState): TurnResult => {
    const missingCore = [];
    if (!draft.itemName) missingCore.push('item');
    if (!draft.quantity) missingCore.push('quantity');
    if (!draft.location) missingCore.push('delivery location');

    if (missingCore.length > 0) {
      return {
        nextState: {
          ...conversationState,
          activeIntent: 'create-pr',
          prDraft: draft,
        },
        messages: [
          createMessage('assistant', "I'll create the PR. I need a little more detail before I can draft it cleanly.", {
            intent: 'create-pr',
            sections: [
              {
                title: 'Missing details',
                bullets: missingCore.map((field) => `Please confirm the ${field}.`),
              },
            ],
          }),
        ],
      };
    }

    if (!draft.unitPrice || !draft.requiredBy) {
      return {
        nextState: {
          ...conversationState,
          activeIntent: 'create-pr',
          prDraft: draft,
        },
        messages: [
          createMessage(
            'assistant',
            `I understand this as ${draft.quantity} ${draft.itemName?.toLowerCase()} for ${draft.location}. I still need the pricing and delivery deadline before I submit it.`,
            {
              intent: 'create-pr',
              sections: [
                {
                  title: 'What I have so far',
                  bullets: [
                    `Item: ${draft.itemName}`,
                    `Quantity: ${draft.quantity}`,
                    `Location: ${draft.location}`,
                  ],
                },
                {
                  title: 'Still needed',
                  bullets: [
                    draft.unitPrice ? 'Unit budget captured.' : 'Approximate budget per unit',
                    draft.requiredBy ? 'Required-by date captured.' : 'Required-by date',
                    draft.requirements?.length ? `Requirements: ${draft.requirements.join(', ')}` : 'Specific requirements or preferences',
                  ],
                },
              ],
            },
          ),
        ],
      };
    }

    const quantity = draft.quantity ?? 0;
    const total = quantity * (draft.unitPrice ?? 0);
    const suggestion = draft.itemName?.toLowerCase().includes('chair')
      ? AI_HISTORICAL_ORDERS.find((item) => item.vendor === 'ErgoFit Solutions')
      : AI_HISTORICAL_ORDERS.find((item) => item.vendor === 'ErgoWorkspace India');
    const suggestedVendor = draft.itemName?.toLowerCase().includes('chair') ? 'ErgoFit Solutions' : 'ErgoWorkspace India';
    const suggestedVendorId = draft.itemName?.toLowerCase().includes('chair') ? 'ergofit' : 'ergoworkspace';

    return {
      nextState: {
        ...conversationState,
        activeIntent: 'create-pr',
        prDraft: {
          ...draft,
          vendorId: suggestedVendorId,
          vendorName: suggestedVendor,
        },
      },
      messages: [
        createMessage('assistant', 'The draft is ready. Review the summary and confirm how you want to proceed.', {
          intent: 'create-pr',
          sections: [
            {
              title: 'Purchase Request Summary',
              bullets: [
                `${draft.itemName} x ${quantity}`,
                `Estimated total: ${formatCurrency(total)}`,
                `Needed by: ${draft.requiredBy ? formatLongDate(draft.requiredBy) : 'TBD'}`,
                `Budget source: ${AI_USER_CONTEXT.defaultBudgetName}`,
              ],
            },
            suggestion
              ? {
                  title: 'Learned from previous orders',
                  bullets: [
                    `${suggestion.vendor} supplied a similar order ${suggestion.orderedMonthsAgo} months ago.`,
                    `Previous PR: ${suggestion.id} at ${formatCurrency(suggestion.unitPrice)} per unit.`,
                    suggestion.note,
                  ],
                }
              : {
                  title: 'Suggested vendor',
                  bullets: [`Recommended vendor: ${suggestedVendor}`],
                },
          ],
          cards: [
            {
              id: 'pr-summary',
              title: draft.title ?? `${draft.itemName} x ${quantity}`,
              badge: 'Ready to create',
              accent: 'info',
              metadata: buildDraftSummary(draft),
            },
          ],
          actions: [
            { id: `create-pr-confirm:${suggestedVendorId}`, label: `Create with ${suggestedVendor}`, primary: true },
            { id: 'vendors-search-alternatives', label: 'Search alternative vendors' },
            { id: 'create-pr-modify', label: 'Modify details' },
          ],
        }),
      ],
    };
  };

  const buildApprovalsDigest = (): TurnResult => {
    const totalPending = AI_PENDING_APPROVALS.reduce((sum, item) => sum + item.amount, 0);

    return {
      nextState: {
        ...conversationState,
        activeIntent: 'approvals',
        selectedApprovalIds: AI_PENDING_APPROVALS.map((item) => item.id),
      },
      messages: [
        createMessage('assistant', "I've reviewed your pending approvals and highlighted what needs immediate attention.", {
          intent: 'approvals',
          stats: [
            { label: 'Requests', value: String(AI_PENDING_APPROVALS.length), accent: 'warning' },
            { label: 'Total pending', value: formatCurrency(totalPending), accent: 'info' },
            { label: 'Budget impact', value: 'Within budget', accent: 'success' },
          ],
          cards: AI_PENDING_APPROVALS.map((item) => ({
            id: item.id,
            title: item.id,
            subtitle: item.title,
            badge: item.urgency,
            accent: item.urgency === 'Urgent' ? 'danger' : item.urgency === 'Due Today' ? 'warning' : 'default',
            metadata: [
              { label: 'Requested by', value: `${item.requester} (${item.department})` },
              { label: 'Amount', value: formatCurrency(item.amount) },
              { label: 'Vendor', value: item.vendor },
              { label: 'Timeline', value: item.dueLabel },
            ],
            bullets: [`Justification: ${item.justification}`],
            actions: [
              { id: `approve-pr:${item.id}`, label: 'Approve', primary: true },
              { id: `open-pr:${item.id}`, label: 'View details' },
            ],
          })),
          sections: [
            {
              title: 'Recommended order',
              bullets: [
                'Approve PR-2026-245 first because onboarding is blocked.',
                'PR-2026-248 is a routine renewal and low-risk to approve.',
                'PR-2026-251 can wait if you want to batch office supplies later.',
              ],
            },
          ],
          actions: [
            { id: 'approvals-approve-top-two', label: 'Approve the first two', primary: true },
            { id: 'approvals-approve-all', label: 'Approve all' },
          ],
        }),
      ],
    };
  };

  const buildVendorRecommendations = (): TurnResult => ({
    nextState: {
      ...conversationState,
      activeIntent: 'vendors',
      vendorSearchTerm: 'standing desks',
    },
    messages: [
      createMessage('assistant', 'I searched verified vendors for standing desks and ranked them using price, history, and delivery performance.', {
        intent: 'vendors',
        cards: AI_VENDOR_RECOMMENDATIONS.map((vendor, index) => ({
          id: vendor.id,
          title: vendor.name,
          subtitle: vendor.specialization,
          badge: index === 0 ? 'Recommended' : undefined,
          accent: index === 0 ? 'success' : 'default',
          metadata: [
            { label: 'Rating', value: `${vendor.rating.toFixed(1)} / 5` },
            { label: 'Price range', value: vendor.priceRange },
            { label: 'Avg delivery', value: vendor.averageDelivery },
            { label: 'Terms', value: vendor.paymentTerms },
          ],
          bullets: [
            `Previous orders: ${vendor.previousOrders}`,
            vendor.lastOrderLabel ? `Last order: ${vendor.lastOrderLabel}` : 'New vendor',
            vendor.highlight,
          ],
          actions: [
            { id: `vendor-details:${vendor.id}`, label: 'View details' },
            { id: `vendor-request-quote:${vendor.id}`, label: 'Request quote', primary: true },
          ],
        })),
        actions: [
          { id: 'vendors-request-quotes-first-two', label: 'Request quotes from first two vendors', primary: true },
          { id: 'vendors-create-pr-ergoworkspace', label: 'Create PR with ErgoWorkspace' },
        ],
      }),
    ],
  });

  const buildQuoteRequestSent = (vendorIds: string[]): TurnResult => {
    const selectedVendors = AI_VENDOR_RECOMMENDATIONS.filter((vendor) => vendorIds.includes(vendor.id));

    return {
      nextState: {
        ...conversationState,
        activeIntent: 'vendors',
        selectedVendorIds: vendorIds,
        quoteWorkspaceReady: true,
      },
      messages: [
        createMessage('assistant', 'Quote requests are out. I created a comparison workspace and will keep this conversation synced with responses.', {
          intent: 'vendors',
          cards: selectedVendors.map((vendor) => ({
            id: `quote-${vendor.id}`,
            title: vendor.name,
            subtitle: `RFQ sent for ${conversationState.vendorSearchTerm ?? 'standing desks'}`,
            badge: 'Awaiting response',
            accent: 'info',
            metadata: [
              { label: 'Contact', value: vendor.id === 'officemax' ? 'sneha@officemax.in' : 'amit@ergoworkspace.in' },
              { label: 'Quote deadline', value: 'March 20, 2026' },
              { label: 'Terms', value: vendor.paymentTerms },
            ],
          })),
          actions: [
            { id: 'tasks-show-quote-comparison', label: 'Show quote comparison', primary: true },
            { id: 'vendors-specify-requirements', label: 'Add quantity and requirements' },
          ],
        }),
      ],
    };
  };

  const buildTasksDigest = (): TurnResult => {
    const urgentTasks = AI_TASKS.filter((task) => task.priority === 'Urgent').length;

    return {
      nextState: {
        ...conversationState,
        activeIntent: 'tasks',
      },
      messages: [
        createMessage('assistant', "Here's the current task view with the items most likely to block procurement this week.", {
          intent: 'tasks',
          stats: [
            { label: 'Urgent', value: String(urgentTasks), accent: 'danger' },
            { label: 'Total tasks', value: String(AI_TASKS.length), accent: 'info' },
            { label: 'Budget decisions', value: '₹7,40,000', accent: 'warning' },
          ],
          cards: AI_TASKS.map((task) => ({
            id: task.id,
            title: task.title,
            subtitle: task.summary,
            badge: task.priority,
            accent: task.priority === 'Urgent' ? 'danger' : task.priority === 'This Week' ? 'warning' : 'default',
            metadata: [
              { label: 'Deadline', value: task.dueLabel },
              ...(task.amountImpact ? [{ label: 'Impact', value: task.amountImpact }] : []),
            ],
            actions: [
              { id: task.id === 'review-standing-desk-quotes' ? 'tasks-show-quote-comparison' : `task-primary:${task.id}`, label: task.ctaPrimary, primary: true },
              ...(task.ctaSecondary ? [{ id: `task-secondary:${task.id}`, label: task.ctaSecondary }] : []),
            ],
          })),
          actions: [
            { id: 'tasks-show-quote-comparison', label: 'Show me the quote comparison', primary: true },
            { id: 'approvals-review', label: 'Focus on approvals' },
          ],
        }),
      ],
    };
  };

  const buildQuoteComparison = (): TurnResult => ({
    nextState: {
      ...conversationState,
      activeIntent: 'quote-comparison',
      quoteWorkspaceReady: true,
    },
    messages: [
      createMessage('assistant', "Three vendors responded for the standing desk RFQ. I ranked them by landed price, delivery speed, and supplier confidence.", {
        intent: 'quote-comparison',
        stats: [
          { label: 'Available budget', value: formatCurrency(300000), accent: 'info' },
          { label: 'Lowest quote', value: formatCurrency(145000), accent: 'success' },
          { label: 'Savings vs usual vendor', value: formatCurrency(20000), accent: 'success' },
        ],
        cards: AI_QUOTE_COMPARISON.map((quote) => ({
          id: quote.id,
          title: quote.vendor,
          subtitle: quote.recommendationTag,
          badge: quote.id === 'officemax' ? 'My recommendation' : undefined,
          accent: quote.id === 'officemax' ? 'success' : 'default',
          metadata: [
            { label: 'Unit price', value: formatCurrency(quote.unitPrice) },
            { label: 'Total', value: formatCurrency(quote.totalPrice) },
            { label: 'Delivery', value: quote.delivery },
            { label: 'Warranty', value: quote.warranty },
          ],
          bullets: [quote.highlight, `Payment terms: ${quote.paymentTerms}`],
          actions: [
            { id: `quotes-accept:${quote.id}`, label: 'Select this vendor', primary: true },
            { id: `vendor-details:${quote.id}`, label: 'View quote' },
          ],
        })),
        sections: [
          {
            title: 'Recommendation',
            bullets: [
              'OfficeMax Solutions gives the lowest landed price.',
              'The trade-off is a 2-year warranty instead of 3 years.',
              'Risk remains low because the vendor is local to Mumbai.',
            ],
          },
        ],
        actions: [
          { id: 'quotes-accept:officemax', label: 'Accept OfficeMax quote and create PR', primary: true },
          { id: 'quotes-negotiate:ergoworkspace', label: 'Negotiate with ErgoWorkspace' },
        ],
      }),
    ],
  });

  const buildBulkSetupDraft = (input: string): TurnResult => {
    const items = parseBulkSetupItems(input);

    return {
      nextState: {
        ...conversationState,
        activeIntent: 'bulk-setup',
        bulkSetup: {
          location: 'Mumbai office',
          items,
        },
      },
      messages: [
        createMessage('assistant', 'I grouped the office setup into approval-friendly bundles so furniture, IT, and pantry items can move in parallel.', {
          intent: 'bulk-setup',
          sections: [
            {
              title: 'Items identified',
              bullets: items.map((item) => `${item.name} x ${item.quantity}`),
            },
            {
              title: 'Suggested PR groups',
              bullets: [
                'Furniture: chairs and desks',
                'IT equipment: laptops, projector, whiteboard',
                'Pantry: coffee machine',
              ],
            },
          ],
          stats: [
            { label: 'PR groups', value: '3', accent: 'info' },
            { label: 'Estimated total', value: formatCurrency(750000), accent: 'warning' },
            { label: 'Approval path', value: 'Parallel', accent: 'success' },
          ],
          actions: [
            { id: 'bulk-autofill', label: 'Auto-fill from previous Mumbai setup', primary: true },
            { id: 'bulk-single-pr', label: 'Create as one PR' },
          ],
        }),
      ],
    };
  };

  const buildBulkSetupAutofill = (requiredBy: string): TurnResult => ({
    nextState: {
      ...conversationState,
      activeIntent: 'bulk-setup',
      bulkSetup: {
        ...(conversationState.bulkSetup ?? { location: 'Mumbai office', items: [] }),
        requiredBy,
        autofilled: true,
      },
    },
    messages: [
      createMessage('assistant', 'I used the previous Mumbai office setup as the baseline and adjusted prices for March 2026.', {
        intent: 'bulk-setup',
        cards: [
          {
            id: 'bulk-furniture',
            title: 'PR Group 1: Furniture & Fixtures',
            badge: formatCurrency(250000),
            accent: 'info',
            bullets: [
              '20 ergonomic office chairs @ ₹3,500',
              '10 standing desks @ ₹18,000',
              'Vendor: ErgoWorkspace India',
            ],
          },
          {
            id: 'bulk-it',
            title: 'PR Group 2: IT Equipment',
            badge: formatCurrency(283500),
            accent: 'info',
            bullets: [
              '5 Dell Latitude laptops @ ₹48,000',
              '1 Epson projector @ ₹35,000',
              "1 magnetic whiteboard 6'x4' @ ₹8,500",
            ],
          },
          {
            id: 'bulk-pantry',
            title: 'PR Group 3: Pantry Equipment',
            badge: formatCurrency(28000),
            accent: 'info',
            bullets: [
              '1 Nespresso professional coffee machine @ ₹28,000',
              'Vendor: KitchenPro India',
            ],
          },
        ],
        sections: [
          {
            title: 'Timeline and approvals',
            bullets: [
              `Required by: ${formatLongDate(requiredBy)}`,
              'All items can reach the Mumbai office by April 10, 2026.',
              `Approval chain: ${AI_USER_CONTEXT.manager} and ${AI_USER_CONTEXT.financeApprover} for furniture and IT.`,
            ],
          },
        ],
        stats: [
          { label: 'Grand total', value: formatCurrency(561500), accent: 'success' },
          { label: 'Savings vs estimate', value: formatCurrency(188500), accent: 'success' },
          { label: 'CEO approval', value: 'Not needed', accent: 'info' },
        ],
        actions: [
          { id: 'bulk-create-all', label: 'Create all PRs', primary: true },
          { id: 'bulk-save-template', label: 'Save as template' },
        ],
      }),
    ],
  });

  const buildBudgetOverview = (): TurnResult => ({
    nextState: {
      ...conversationState,
      activeIntent: 'budget',
    },
    messages: [
      createMessage('assistant', `Here's your ${AI_BUDGET_OVERVIEW.department} budget position for ${AI_BUDGET_OVERVIEW.monthLabel}.`, {
        intent: 'budget',
        stats: [
          { label: 'Total budget', value: formatCurrency(AI_BUDGET_OVERVIEW.totalBudget), accent: 'info' },
          { label: 'Spent', value: formatCurrency(AI_BUDGET_OVERVIEW.spentToDate), accent: 'warning' },
          { label: 'Committed', value: formatCurrency(AI_BUDGET_OVERVIEW.committed), accent: 'warning' },
          { label: 'Available', value: formatCurrency(AI_BUDGET_OVERVIEW.available), accent: 'success' },
        ],
        cards: AI_BUDGET_OVERVIEW.categories.map((category) => ({
          id: category.name,
          title: category.name,
          badge: category.status,
          accent:
            category.status === 'Critical'
              ? 'danger'
              : category.status === 'Running Low'
                ? 'warning'
                : 'success',
          metadata: [
            { label: 'Spent', value: formatCurrency(category.spent) },
            { label: 'Budget', value: formatCurrency(category.total) },
            { label: 'Available', value: formatCurrency(category.available) },
          ],
        })),
        sections: detailedResponses
          ? [
              {
                title: 'Trend and forecast',
                bullets: [AI_BUDGET_OVERVIEW.trendingNote, AI_BUDGET_OVERVIEW.forecastNote],
              },
              {
                title: 'Recommendations',
                bullets: AI_BUDGET_OVERVIEW.recommendations,
              },
            ]
          : undefined,
      }),
    ],
  });

  const executeCreatePR = (draft: PRDraftState, vendorId?: string, vendorName?: string): TurnResult => {
    const quantity = draft.quantity ?? 1;
    const unitPrice = draft.unitPrice ?? 0;
    const amount = quantity * unitPrice;
    const vendor = vendorName ?? draft.vendorName ?? 'Preferred vendor';
    const payload: AIConversationPRPayload = {
      title: draft.title ?? `${draft.itemName ?? 'Purchase Request'} x ${quantity}`,
      vendor,
      amount,
      department: AI_USER_CONTEXT.department,
      category: draft.category ?? 'General Procurement',
      dueDate: draft.requiredBy ?? REFERENCE_DATE.toISOString().split('T')[0],
    };

    const generatedIds = onCreatePurchaseRequests?.([payload]) ?? [`PR-2026-${Math.floor(Math.random() * 900 + 100)}`];
    const createdId = generatedIds[0];

    return {
      nextState: {
        ...conversationState,
        activeIntent: null,
        prDraft: undefined,
      },
      messages: [
        createMessage('assistant', `${createdId} has been created and routed for approval.`, {
          intent: 'create-pr',
          cards: [
            {
              id: createdId,
              title: createdId,
              subtitle: `${draft.itemName} x ${quantity}`,
              badge: 'Created',
              accent: 'success',
              metadata: [
                { label: 'Vendor', value: vendor },
                { label: 'Total', value: formatCurrency(amount) },
                { label: 'Required by', value: draft.requiredBy ? formatLongDate(draft.requiredBy) : 'TBD' },
                { label: 'Approver', value: AI_USER_CONTEXT.manager },
              ],
              bullets: [
                `${AI_USER_CONTEXT.financeApprover} will auto-approve if it stays under the finance threshold.`,
                `${AI_USER_CONTEXT.manager} has been notified.`,
              ],
              actions: [
                { id: `open-pr:${createdId}`, label: 'View PR details', primary: true },
              ],
            },
          ],
          actions: [
            { id: 'starter-create-pr', label: 'Create another PR' },
            { id: 'starter-approvals', label: 'Track approvals' },
          ],
        }),
      ],
    };
  };

  const executeBulkCreate = (): TurnResult => {
    const requiredBy = conversationState.bulkSetup?.requiredBy ?? '2026-04-15';
    const payloads: AIConversationPRPayload[] = [
      {
        title: 'Furniture & Fixtures - Mumbai Office Setup',
        vendor: 'ErgoWorkspace India',
        amount: 250000,
        department: 'Engineering',
        category: 'Furniture & Fixtures',
        dueDate: requiredBy,
      },
      {
        title: 'IT Equipment - Mumbai Office Setup',
        vendor: 'Dell Technologies + OfficeHub',
        amount: 283500,
        department: 'Engineering',
        category: 'IT Equipment',
        dueDate: requiredBy,
      },
      {
        title: 'Pantry Equipment - Mumbai Office Setup',
        vendor: 'KitchenPro India',
        amount: 28000,
        department: 'Operations',
        category: 'Pantry Equipment',
        dueDate: requiredBy,
      },
    ];
    const ids = onCreatePurchaseRequests?.(payloads) ?? ['PR-2026-258', 'PR-2026-259', 'PR-2026-260'];

    return {
      nextState: {
        ...conversationState,
        activeIntent: null,
        bulkSetup: undefined,
      },
      messages: [
        createMessage('assistant', 'All grouped purchase requests have been created and the office setup dashboard is now in motion.', {
          intent: 'bulk-setup',
          cards: ids.map((id, index) => ({
            id,
            title: id,
            subtitle: payloads[index].title,
            badge: 'Created',
            accent: 'success',
            metadata: [
              { label: 'Amount', value: formatCurrency(payloads[index].amount) },
              { label: 'Vendor', value: payloads[index].vendor },
              { label: 'Required by', value: formatLongDate(requiredBy) },
            ],
          })),
          sections: [
            {
              title: 'Next steps',
              bullets: [
                `${AI_USER_CONTEXT.manager} has been notified for all three PRs.`,
                `${AI_USER_CONTEXT.financeApprover} is included on the IT and furniture PRs.`,
                'Quotes and delivery tracking can now continue in parallel.',
              ],
            },
          ],
        }),
      ],
    };
  };

  const executeApproval = (ids: string[]): TurnResult => {
    onApprovePurchaseRequests?.(ids);

    const approvedItems = AI_PENDING_APPROVALS.filter((item) => ids.includes(item.id));
    const remaining = AI_PENDING_APPROVALS.filter((item) => !ids.includes(item.id));
    const approvedAmount = approvedItems.reduce((sum, item) => sum + item.amount, 0);

    return {
      nextState: {
        ...conversationState,
        activeIntent: 'approvals',
        selectedApprovalIds: remaining.map((item) => item.id),
      },
      messages: [
        createMessage('assistant', 'The approval action is complete. I updated the status and triggered the next workflow step for each PR.', {
          intent: 'approvals',
          stats: [
            { label: 'Approved today', value: formatCurrency(approvedAmount), accent: 'success' },
            { label: 'Remaining approvals', value: String(remaining.length), accent: remaining.length ? 'warning' : 'success' },
          ],
          cards: approvedItems.map((item) => ({
            id: item.id,
            title: item.id,
            subtitle: item.title,
            badge: 'Approved',
            accent: 'success',
            metadata: [
              { label: 'Requester', value: item.requester },
              { label: 'Amount', value: formatCurrency(item.amount) },
              {
                label: 'Next step',
                value: item.id === 'PR-2026-248' ? 'Finance payment processing' : 'Move to PO creation',
              },
            ],
          })),
          sections: remaining.length
            ? [
                {
                  title: 'Still pending',
                  bullets: remaining.map((item) => `${item.id} remains pending.`),
                },
              ]
            : undefined,
          actions: remaining.length
            ? [{ id: `open-pr:${remaining[0].id}`, label: `Open ${remaining[0].id}` }]
            : undefined,
        }),
      ],
    };
  };

  const createGenericResponse = (): TurnResult => ({
    nextState: {
      ...conversationState,
      activeIntent: null,
    },
    messages: [
      createMessage('assistant', 'I can take that forward, but I need a more specific instruction to choose the right workflow.', {
        actions: [
          { id: 'starter-create-pr', label: 'Create new PR', primary: true },
          { id: 'starter-approvals', label: 'Review approvals' },
          { id: 'starter-vendors', label: 'Search vendors' },
          { id: 'starter-budget', label: 'Check budget' },
        ],
      }),
    ],
  });

  const resolveTurn = (input: string, actionId?: string): TurnResult => {
    const normalized = input.toLowerCase().trim();

    if (actionId?.startsWith('open-pr:')) {
      const prId = actionId.split(':')[1];
      return {
        messages: [createMessage('assistant', `Opening ${prId} in the dashboard detail view.`)],
        afterCommit: () => onOpenPurchaseRequest?.(prId),
      };
    }

    if (actionId?.startsWith('approve-pr:')) {
      return executeApproval([actionId.split(':')[1]]);
    }

    if (actionId?.startsWith('vendor-details:')) {
      const vendorId = actionId.split(':')[1];
      const vendor =
        AI_VENDOR_RECOMMENDATIONS.find((item) => item.id === vendorId) ??
        AI_QUOTE_COMPARISON.find((item) => item.id === vendorId);

      if (!vendor) return createGenericResponse();

      const vendorTitle = 'name' in vendor ? vendor.name : vendor.vendor;

      return {
        messages: [
          createMessage('assistant', `${vendorTitle} is a strong fit for ergonomic furniture procurement.`, {
            cards: [
              {
                id: vendorId,
                title: vendorTitle,
                accent: 'info',
                metadata:
                  'name' in vendor
                    ? [
                        { label: 'Rating', value: `${vendor.rating.toFixed(1)} / 5` },
                        { label: 'Specialization', value: vendor.specialization },
                        { label: 'Location', value: vendor.location },
                        { label: 'Terms', value: vendor.paymentTerms },
                      ]
                    : [
                        { label: 'Unit price', value: formatCurrency(vendor.unitPrice) },
                        { label: 'Delivery', value: vendor.delivery },
                        { label: 'Warranty', value: vendor.warranty },
                        { label: 'Terms', value: vendor.paymentTerms },
                      ],
                bullets: [vendor.highlight],
              },
            ],
          }),
        ],
      };
    }

    if (actionId === 'approvals-approve-top-two') {
      return executeApproval(AI_PENDING_APPROVALS.slice(0, 2).map((item) => item.id));
    }

    if (actionId === 'approvals-approve-all') {
      return executeApproval(AI_PENDING_APPROVALS.map((item) => item.id));
    }

    if (actionId === 'starter-approvals' || normalized.includes('pending approval')) {
      return buildApprovalsDigest();
    }

    if (actionId === 'starter-vendors' || actionId === 'vendors-search-standing-desks' || actionId === 'vendors-search-alternatives') {
      if (actionId === 'starter-vendors') {
        return {
          nextState: { ...conversationState, activeIntent: 'vendors' },
          messages: [
            createMessage('assistant', 'Tell me what you need and I will rank vendors using historical performance, delivery speed, and pricing.', {
              intent: 'vendors',
              actions: [
                { id: 'vendors-search-standing-desks', label: 'Standing desks', primary: true },
                { id: 'vendors-search-furniture', label: 'Furniture suppliers' },
                { id: 'vendors-search-it', label: 'IT equipment vendors' },
              ],
            }),
          ],
        };
      }

      if (actionId === 'vendors-search-alternatives') {
        return {
          nextState: { ...conversationState, activeIntent: 'vendors' },
          messages: [
            createMessage('assistant', `I can compare alternative vendors for ${conversationState.prDraft?.itemName ?? 'this request'}. The strongest options in your recent history are below.`),
            ...buildVendorRecommendations().messages,
          ],
        };
      }

      return buildVendorRecommendations();
    }

    if (actionId === 'vendors-request-quotes-first-two') {
      return buildQuoteRequestSent(['ergoworkspace', 'officemax']);
    }

    if (actionId?.startsWith('vendor-request-quote:')) {
      return buildQuoteRequestSent([actionId.split(':')[1]]);
    }

    if (actionId === 'vendors-create-pr-ergoworkspace') {
      return executeCreatePR(
        {
          itemName: 'Standing Desks',
          title: 'Standing Desks x 10',
          quantity: 10,
          unitPrice: 16500,
          requiredBy: '2026-03-31',
          location: 'Mumbai office',
          category: 'Furniture & Fixtures',
          vendorId: 'ergoworkspace',
          vendorName: 'ErgoWorkspace India',
        },
        'ergoworkspace',
        'ErgoWorkspace India',
      );
    }

    if (actionId === 'vendors-specify-requirements') {
      return {
        messages: [
          createMessage('assistant', 'Send the quantity, target budget, and any desk requirements. I will attach them to the RFQ workspace and future PR draft.'),
        ],
      };
    }

    if (actionId === 'starter-tasks' || normalized.includes('view my task')) {
      return buildTasksDigest();
    }

    if (actionId === 'approvals-review') {
      return buildApprovalsDigest();
    }

    if (actionId === 'tasks-show-quote-comparison' || normalized.includes('quote comparison')) {
      return buildQuoteComparison();
    }

    if (actionId?.startsWith('quotes-negotiate:')) {
      const vendorId = actionId.split(':')[1];
      const vendor = AI_VENDOR_RECOMMENDATIONS.find((item) => item.id === vendorId);
      return {
        nextState: { ...conversationState, activeIntent: 'quote-comparison' },
        messages: [
          createMessage('assistant', `I drafted a negotiation request for ${vendor?.name ?? 'the vendor'} asking them to match the ₹14,500 unit price from OfficeMax Solutions.`),
        ],
      };
    }

    if (actionId?.startsWith('quotes-accept:')) {
      const vendorId = actionId.split(':')[1];
      const selectedQuote = AI_QUOTE_COMPARISON.find((quote) => quote.id === vendorId);
      if (!selectedQuote) return createGenericResponse();

      return executeCreatePR(
        {
          itemName: 'Standing Desks',
          title: 'Standing Desks x 10',
          quantity: 10,
          unitPrice: selectedQuote.unitPrice,
          requiredBy: '2026-03-31',
          location: 'Mumbai office',
          category: 'Furniture & Fixtures',
          vendorId,
          vendorName: selectedQuote.vendor,
        },
        vendorId,
        selectedQuote.vendor,
      );
    }

    if (actionId === 'starter-budget' || normalized.includes('budget do i have left') || normalized.includes('budget left')) {
      return buildBudgetOverview();
    }

    if (actionId === 'bulk-autofill') {
      const requiredBy = conversationState.bulkSetup?.requiredBy ?? '2026-04-15';
      return buildBulkSetupAutofill(requiredBy);
    }

    if (actionId === 'bulk-create-all' || normalized === 'create all prs' || normalized === 'create all') {
      return executeBulkCreate();
    }

    if (actionId === 'bulk-save-template') {
      return { messages: [createMessage('assistant', 'Saved as "Mumbai Office Setup" so you can reuse the same grouped workflow in one click next time.')] };
    }

    if (actionId === 'bulk-single-pr') {
      return { messages: [createMessage('assistant', 'A single PR is possible, but it will likely require a higher approval level and slow down parallel vendor coordination.')] };
    }

    if (actionId?.startsWith('task-primary:') || actionId?.startsWith('task-secondary:')) {
      return {
        messages: [
          createMessage('assistant', 'I captured that task action. The next best step is to continue the workflow from the linked PR, quote workspace, or report.'),
        ],
      };
    }

    if (actionId === 'starter-create-pr') {
      return {
        nextState: { ...conversationState, activeIntent: 'create-pr', prDraft: {} },
        messages: [
          createMessage('assistant', 'Describe what you need in natural language and I will extract the item, quantity, budget, and delivery details.', {
            intent: 'create-pr',
            sections: [
              {
                title: 'Example',
                bullets: ['"I need 10 ergonomic chairs for the Mumbai office by March 31 around ₹3,000 each."'],
              },
            ],
          }),
        ],
      };
    }

    if (actionId === 'create-pr-modify') {
      return {
        nextState: { ...conversationState, activeIntent: 'create-pr' },
        messages: [createMessage('assistant', 'Tell me which field to change and I will update the draft before submission.')],
      };
    }

    if (actionId?.startsWith('create-pr-confirm:')) {
      const vendorId = actionId.split(':')[1];
      const vendor =
        AI_VENDOR_RECOMMENDATIONS.find((item) => item.id === vendorId)?.name ??
        (vendorId === 'ergofit' ? 'ErgoFit Solutions' : undefined);
      return executeCreatePR(conversationState.prDraft ?? {}, vendorId, vendor);
    }

    if (normalized.includes('approve the first two')) {
      return executeApproval(AI_PENDING_APPROVALS.slice(0, 2).map((item) => item.id));
    }

    if (conversationState.activeIntent === 'approvals' && normalized.startsWith('approve')) {
      const selectedIndexes = parseSelectionNumbers(normalized);
      const selectedIds =
        selectedIndexes.length > 0
          ? (selectedIndexes.map((index) => AI_PENDING_APPROVALS[index]?.id).filter(Boolean) as string[])
          : AI_PENDING_APPROVALS.filter((item) => normalized.includes(item.id.toLowerCase())).map((item) => item.id);

      if (selectedIds.length > 0) return executeApproval(selectedIds);
    }

    if (normalized.includes('standing desk')) {
      return buildVendorRecommendations();
    }

    if (normalized.includes('request quotes from first two')) {
      return buildQuoteRequestSent(['ergoworkspace', 'officemax']);
    }

    if (normalized.includes('show me the quote comparison')) {
      return buildQuoteComparison();
    }

    const bulkItems = parseBulkSetupItems(input);
    if (bulkItems.length >= 3) {
      return buildBulkSetupDraft(input);
    }

    if (conversationState.activeIntent === 'bulk-setup' && (normalized.includes('auto-fill') || normalized.includes('autofill'))) {
      const requiredBy = resolveDatePhrase(input) ?? '2026-04-15';
      return buildBulkSetupAutofill(requiredBy);
    }

    if (conversationState.activeIntent === 'bulk-setup' && normalized.includes('april')) {
      const requiredBy = resolveDatePhrase(input) ?? '2026-04-15';
      return buildBulkSetupAutofill(requiredBy);
    }

    const currentIntent =
      conversationState.activeIntent && conversationState.activeIntent !== 'unknown'
        ? conversationState.activeIntent
        : detectIntent(input);

    if (currentIntent === 'create-pr') {
      const mergedDraft = mergePRDraft(conversationState.prDraft, input);

      if ((normalized.includes('create it with') || normalized.includes('create with')) && mergedDraft.itemName) {
        const wantsErgoFit = normalized.includes('ergofit');
        const wantsErgoWorkspace = normalized.includes('ergoworkspace');
        return executeCreatePR(
          mergedDraft,
          wantsErgoFit ? 'ergofit' : wantsErgoWorkspace ? 'ergoworkspace' : mergedDraft.vendorId,
          wantsErgoFit ? 'ErgoFit Solutions' : wantsErgoWorkspace ? 'ErgoWorkspace India' : mergedDraft.vendorName,
        );
      }

      return buildCreatePRFollowUp(mergedDraft);
    }

    if (currentIntent === 'approvals') return buildApprovalsDigest();
    if (currentIntent === 'vendors') return buildVendorRecommendations();
    if (currentIntent === 'tasks') return buildTasksDigest();
    if (currentIntent === 'budget') return buildBudgetOverview();

    return createGenericResponse();
  };

  const handleTurn = async (text: string, actionId?: string) => {
    const messageText = text.trim();
    if (!messageText) return;

    const userMessage = createMessage('user', messageText);
    setMessages((previous) => [...previous, userMessage]);
    setInputValue('');
    setIsTyping(true);
    setView('chat');
    setIsMinimized(false);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const result = resolveTurn(messageText, actionId);

    setMessages((previous) => [...previous, ...result.messages]);
    if (result.nextState) setConversationState(result.nextState);
    setIsTyping(false);
    result.afterCommit?.();
  };

  const handleInputFocusTrap = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;

    const root = dialogRef.current;
    if (!root) return;

    const focusableElements = Array.from(
      root.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element: HTMLElement) => !element.hasAttribute('data-focus-exclude'));

    if (focusableElements.length === 0) return;

    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && (document.activeElement === firstElement || currentIndex === -1)) {
      event.preventDefault();
      (lastElement as HTMLElement).focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      (firstElement as HTMLElement).focus();
    }
  };

  const renderActionButton = (action: ChatAction, key: string) => (
    <BlendButton
      key={key}
      onClick={() => handleTurn(action.label, action.id)}
      buttonType={action.primary ? BlendButtonType.PRIMARY : BlendButtonType.SECONDARY}
      size={BlendButtonSize.SMALL}
      text={action.label}
    />
  );

  const renderCard = (card: ChatCard) => (
    <BlendCard key={card.id} variant={BlendCardVariant.CUSTOM}>
      <div className={`rounded-2xl border p-4 ${accentClasses[card.accent ?? 'default']}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold">{card.title}</h4>
            {card.subtitle && <p className="mt-1 text-xs opacity-80">{card.subtitle}</p>}
          </div>
          {card.badge && (
            <span className="rounded-full bg-white/70 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-700">
              {card.badge}
            </span>
          )}
        </div>

        {card.metadata && card.metadata.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {card.metadata.map((item) => (
              <div key={`${card.id}-${item.label}`} className="rounded-xl bg-white/70 p-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{item.label}</p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">{item.value}</p>
              </div>
            ))}
          </div>
        )}

        {card.bullets && card.bullets.length > 0 && (
          <div className="mt-4 space-y-2">
            {card.bullets.map((bullet) => (
              <div key={bullet} className="flex gap-2 text-xs leading-relaxed text-zinc-700">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                <span>{bullet}</span>
              </div>
            ))}
          </div>
        )}

        {card.actions && card.actions.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {card.actions.map((action) => renderActionButton(action, `${card.id}-${action.id}`))}
          </div>
        )}
      </div>
    </BlendCard>
  );

  const applyResize = (direction: ResizeDirection, deltaWidth: number, deltaHeight: number) => {
    const currentSize = resizeStartRef.current.size;
    const currentPosition = resizeStartRef.current.position;
    const currentViewport = viewportRef.current;
    const oldRight = currentPosition.x + currentSize.width;

    let nextPosition = currentPosition;
    let nextWidth = currentSize.width + deltaWidth;
    let nextHeight = currentSize.height + deltaHeight;

    if (direction === 'left' || direction === 'bottomLeft') {
      nextPosition = {
        ...nextPosition,
        x: Math.max(0, currentPosition.x - deltaWidth),
      };
      nextWidth = oldRight - nextPosition.x;
    }

    const clampedSize = clampWindowSize(
      { width: nextWidth, height: nextHeight },
      currentViewport,
      nextPosition,
    );

    if (direction === 'left' || direction === 'bottomLeft') {
      nextPosition = {
        ...nextPosition,
        x: Math.max(0, oldRight - clampedSize.width),
      };
    }

    const clampedPosition = clampWindowPosition(nextPosition, currentViewport);

    setWindowPosition(clampedPosition);
    setWindowSize(clampedSize);
  };

  const onDrag = (_event: DraggableEvent, data: DraggableData) => {
    setWindowPosition(
      clampWindowPosition(
        {
          x: data.x,
          y: data.y,
        },
        viewportRef.current,
      ),
    );
  };

  const windowShadow = isDragging || isResizing
    ? '0 0 0 1px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.08), 0 20px 60px rgba(0, 0, 0, 0.2)'
    : '0 0 0 1px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.08), 0 12px 48px rgba(0, 0, 0, 0.12)';

  const renderHeader = () => (
    <div
      className={`relative border-b border-zinc-100 bg-white px-6 py-5 ${
        isFloatingMode ? `drag-handle rounded-t-[16px] ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}` : 'cursor-default'
      }`}
      style={{ minHeight: '88px' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[linear-gradient(135deg,#6366F1_0%,#8B5CF6_100%)]">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="xyne-ai-title" className="text-[18px] font-semibold leading-[1.2] text-zinc-900">
              Xyne AI
            </h2>
            <p id="xyne-ai-description" className="mt-1 text-[12px] leading-[1.4] text-zinc-500">
              Procurement copilots for PR, approvals, vendors, and budgets
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 pl-3" data-no-drag="true">
          <div className="xyne-no-drag">
            <BlendButton
              buttonType={BlendButtonType.SECONDARY}
              subType={BlendButtonSubType.ICON_ONLY}
              size={BlendButtonSize.SMALL}
              leadingIcon={<Search className="h-4 w-4" />}
              onClick={() => setView((current) => (current === 'search' ? 'chat' : 'search'))}
              aria-label="Search conversation"
              title="Search"
            />
          </div>
          <div className="xyne-no-drag">
            <BlendButton
              buttonType={BlendButtonType.SECONDARY}
              subType={BlendButtonSubType.ICON_ONLY}
              size={BlendButtonSize.SMALL}
              leadingIcon={<Settings className="h-4 w-4" />}
              onClick={() => setView((current) => (current === 'settings' ? 'chat' : 'settings'))}
              aria-label="Open settings"
              title="Settings"
            />
          </div>
          <div className="xyne-no-drag">
            <BlendButton
              buttonType={BlendButtonType.SECONDARY}
              subType={BlendButtonSubType.ICON_ONLY}
              size={BlendButtonSize.SMALL}
              leadingIcon={<X className="h-4 w-4" />}
              onClick={onClose}
              aria-label="Close Xyne AI"
              title="Close"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderWelcomeScreen = () => {
    const welcomeMessage = messages[0];
    const quickActions = welcomeMessage.actions?.slice(0, 4) ?? [];
    const budgetAction = welcomeMessage.actions?.[4];

    return (
      <div className="px-6 py-6">
        <p className="mb-6 text-[14px] leading-[1.6] tracking-[-0.01em] text-zinc-600">{welcomeMessage.content}</p>

        <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500">
          What I can do right now
        </h3>

        <div className="mb-6 space-y-2.5">
          {welcomeMessage.sections?.[0]?.bullets?.map((bullet) => (
            <div key={bullet} className="flex gap-2.5">
              <span className="text-[13px] leading-[1.5] text-zinc-400">•</span>
              <span className="text-[13px] leading-[1.5] text-zinc-700">{bullet}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {quickActions.map((action) => (
            <div key={action.id} className="w-full">
              <BlendButton
                onClick={() => handleTurn(action.label, action.id)}
                buttonType={action.primary ? BlendButtonType.PRIMARY : BlendButtonType.SECONDARY}
                size={BlendButtonSize.MEDIUM}
                text={action.label}
                fullWidth
              />
            </div>
          ))}
        </div>

        {budgetAction && (
          <div className="mt-4">
            <BlendButton
              onClick={() => handleTurn(budgetAction.label, budgetAction.id)}
              buttonType={BlendButtonType.PRIMARY}
              subType={BlendButtonSubType.INLINE}
              size={BlendButtonSize.SMALL}
              text={budgetAction.label}
            />
          </div>
        )}
      </div>
    );
  };

  const renderChatContent = () => (
    <div className="space-y-5 px-6 py-6" aria-live="polite">
      {messages.map((message) => (
        <div key={message.id} className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
          <div className="flex max-w-[92%] items-end gap-2">
            {message.role === 'assistant' && (
              <div className="mb-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
            )}

            <div
              className={`rounded-2xl p-4 text-[14px] leading-relaxed shadow-sm ${
                message.role === 'user'
                  ? 'rounded-br-none bg-blue-600 text-white'
                  : 'rounded-bl-none bg-zinc-100 text-zinc-900'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>

              {message.stats && message.stats.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {message.stats.map((stat) => (
                    <div key={`${message.id}-${stat.label}`} className={`rounded-xl border p-3 ${accentClasses[stat.accent ?? 'default']}`}>
                      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{stat.label}</p>
                      <p className="mt-1 text-sm font-bold">{stat.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {message.sections && message.sections.length > 0 && (
                <div className="mt-4 space-y-3">
                  {message.sections.map((section) => (
                    <div key={`${message.id}-${section.title}`} className={`rounded-xl border p-3 ${accentClasses[section.accent ?? 'default']}`}>
                      <h4 className="text-xs font-semibold uppercase tracking-wider opacity-70">{section.title}</h4>
                      {section.text && <p className="mt-2 text-sm">{section.text}</p>}
                      {section.bullets && (
                        <div className="mt-2 space-y-2 text-sm">
                          {section.bullets.map((bullet) => (
                            <div key={bullet} className="flex gap-2">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                              <span>{bullet}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {message.cards && message.cards.length > 0 && <div className="mt-4 space-y-3">{message.cards.map(renderCard)}</div>}

              {message.actions && message.actions.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {message.actions.map((action) => renderActionButton(action, `${message.id}-${action.id}`))}
                </div>
              )}
            </div>
          </div>
          <span className="mt-1.5 px-1 text-[10px] font-medium text-zinc-400">{formatTime(message.timestamp)}</span>
        </div>
      ))}

      {isTyping && (
        <div className="flex items-end gap-2">
          <div className="mb-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <div className="flex gap-1.5 rounded-2xl rounded-bl-none bg-zinc-100 p-3.5 shadow-sm">
            <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
            <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
            <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );

  const renderBody = () => {
    if (view === 'search') {
      return (
        <div className="space-y-4 px-6 py-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-2">
            <BlendSearchInput
              placeholder="Search conversation"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <h4 className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400">Recent Messages</h4>
            {filteredMessages.map((message) => (
              <button key={message.id} className="w-full rounded-xl p-3 text-left transition-colors hover:bg-zinc-50">
                <p className="line-clamp-2 text-sm text-zinc-700">{message.content}</p>
                <p className="mt-1 text-[10px] text-zinc-400">{formatTime(message.timestamp)}</p>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (view === 'settings') {
      return (
        <div className="space-y-6 px-6 py-6">
          <div className="space-y-3">
            <h4 className="px-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-zinc-500">Preferences</h4>

            {[
              { label: 'Detailed responses', checked: detailedResponses, onToggle: () => setDetailedResponses((value) => !value) },
              { label: 'Auto-suggest next actions', checked: true },
              { label: 'Keep workflow context between sessions', checked: true },
            ].map((preference) => (
              <button
                key={preference.label}
                onClick={preference.onToggle}
                className="flex w-full items-center justify-between rounded-xl p-3 text-left transition-colors hover:bg-zinc-50"
              >
                <span className="text-sm text-zinc-700">{preference.label}</span>
                <div className={`relative h-5 w-10 rounded-full ${preference.checked ? 'bg-blue-600' : 'bg-zinc-200'}`}>
                  <div className={`absolute top-1 h-3 w-3 rounded-full bg-white transition-all ${preference.checked ? 'left-6' : 'left-1'}`} />
                </div>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <h4 className="px-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-zinc-500">Capabilities</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'PR creation', icon: FileStack },
                { label: 'Approvals', icon: Bell },
                { label: 'Vendor search', icon: Search },
                { label: 'Budget checks', icon: Wallet },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <item.icon className="h-4 w-4 text-blue-600" />
                  <p className="mt-2 text-sm font-semibold text-zinc-900">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="px-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-zinc-500">Suggested Backend APIs</h4>
            <div className="space-y-2">
              {AI_BACKEND_ENDPOINTS.map((endpoint) => (
                <div key={endpoint.path} className="rounded-xl border border-zinc-200 bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-blue-600">{endpoint.method}</p>
                      <p className="mt-1 font-mono text-sm text-zinc-900">{endpoint.path}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-zinc-300" />
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-500">{endpoint.purpose}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-zinc-100 pt-6">
            <button
              onClick={clearHistory}
              className="flex w-full items-center gap-3 rounded-xl p-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Clear conversation history
            </button>
          </div>
        </div>
      );
    }

    if (isWelcomeState) return renderWelcomeScreen();
    return renderChatContent();
  };

  const renderContextPill = () => {
    if (!showContext || !currentContext) return null;

    return (
      <div
        className={`flex items-center justify-between rounded-[8px] border border-blue-200 bg-blue-50 px-[14px] py-[10px] ${
          isFloatingMode ? 'mb-4' : 'mb-3'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-base leading-none text-blue-600">ⓘ</span>
          <span className="text-[13px] font-medium text-blue-800">Context: {currentContext}</span>
        </div>
        <button
          className="flex h-5 w-5 items-center justify-center rounded-[4px] text-blue-400 transition-colors hover:bg-blue-600/10 hover:text-blue-500"
          onClick={() => setShowContext(false)}
          aria-label="Hide context"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  };

  const renderFooter = () => (
    <div
      className={`bg-white ${
        isFloatingMode || isEmbedded
          ? `relative border-t border-zinc-200 px-5 py-3 pb-8 ${isFloatingMode ? 'rounded-b-[16px]' : ''}`
          : 'border-t border-zinc-100 px-6 py-3'
      }`}
    >
      {renderContextPill()}
      <div className="rounded-[18px] border border-zinc-300 bg-white px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
        <div className="mb-2 flex items-center gap-2">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-zinc-200 bg-zinc-50 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Tags"
          >
            <Hash className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-zinc-200 bg-zinc-50 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Search context"
            onClick={() => setView('search')}
          >
            <Search className="h-4 w-4" />
          </button>
        </div>

        <textarea
          rows={1}
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              if (!isTyping && inputValue.trim()) {
                void handleTurn(inputValue);
              }
            }
          }}
          disabled={isTyping}
          placeholder="Ask Xyne AI"
          className="custom-scrollbar mb-2 min-h-[26px] max-h-[96px] w-full resize-none border-none bg-transparent text-[14px] leading-[1.45] text-zinc-700 outline-none placeholder:text-zinc-500"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-[8px] text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
              aria-label="Add item"
            >
              <Plus className="h-4 w-4" />
            </button>
            <div className="h-6 w-px bg-zinc-200" />
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-[8px] text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
              aria-label="Web context"
            >
              <Globe className="h-4 w-4" />
            </button>
            <div className="h-6 w-px bg-zinc-200" />
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-[8px] text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
              aria-label="Attach file"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-[8px] text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
              aria-label="Add document"
            >
              <FileText className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            disabled={isTyping || !inputValue.trim()}
            onClick={() => {
              if (!isTyping && inputValue.trim()) {
                void handleTurn(inputValue);
              }
            }}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-all ${
              isTyping || !inputValue.trim()
                ? 'cursor-not-allowed bg-zinc-200 text-zinc-400'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            aria-label="Send message"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-1.5 text-center text-[11px] text-zinc-400">Enter to send    Shift + Enter for new line</div>
      {(isFloatingMode || isEmbedded) && <div className="absolute bottom-4 right-5 text-[11px] text-zinc-300">{latestTimestamp}</div>}
    </div>
  );

  const renderWindowContent = () => (
    <BlendThemeProvider theme={BlendTheme.LIGHT}>
      <motion.section
        ref={dialogRef}
        role="dialog"
        aria-label="Xyne AI Chat Assistant"
        aria-labelledby="xyne-ai-title"
        aria-describedby="xyne-ai-description"
        aria-modal="false"
        tabIndex={-1}
        onKeyDown={handleInputFocusTrap}
        initial={isMobile ? { opacity: 0, y: 24 } : { opacity: 0, scale: 0.9, y: 24 }}
        animate={{
          opacity: 1,
          scale: isFloatingMode ? (isDragging ? 1.01 : 1) : 1,
          y: 0,
          x: isFloatingMode && isBumping ? [0, -8, 8, -6, 6, 0] : 0,
        }}
        exit={isMobile ? { opacity: 0, y: 24 } : { opacity: 0, scale: 0.95, y: 24 }}
        transition={{ duration: isMobile ? 0.3 : 0.35, ease: [0.34, 1.56, 0.64, 1] }}
        style={{
          boxShadow: isFloatingMode ? windowShadow : 'none',
          borderColor: isFloatingMode ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
        }}
        className={`flex h-full w-full flex-col overflow-hidden bg-white ${
          isFloatingMode ? 'rounded-[16px] border' : 'border-0 rounded-none'
        }`}
      >
        {renderHeader()}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">{renderBody()}</div>
        {renderFooter()}
      </motion.section>
    </BlendThemeProvider>
  );

  if (!isOpen) return null;

  if (isEmbedded) {
    return <div className="h-full min-h-0">{renderWindowContent()}</div>;
  }

  if (isMobile) {
    return createPortal(
      <motion.div
        className="fixed inset-0 z-[9999] bg-white"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      >
        {renderWindowContent()}
      </motion.div>,
      document.body,
    );
  }

  if (isMinimized) {
    return createPortal(
      <motion.button
        initial={{ opacity: 0, scale: 0.7, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.7, y: 20 }}
        transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
        onClick={() => {
          setIsMinimized(false);
          requestAnimationFrame(() => focusComposer());
        }}
        className="fixed bottom-6 right-6 z-[9999] flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#6366F1_0%,#8B5CF6_100%)] text-white shadow-[0_8px_24px_rgba(99,102,241,0.35)] transition-transform hover:scale-105"
        aria-label="Restore Xyne AI"
      >
        <Sparkles className="h-6 w-6" />
      </motion.button>,
      document.body,
    );
  }

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[9999]">
      <Draggable
        nodeRef={draggableNodeRef}
        handle=".drag-handle"
        cancel=".xyne-no-drag,button,textarea,input,a,[data-no-drag='true']"
        bounds={activeBounds}
        position={windowPosition}
        onStart={() => setIsDragging(true)}
        onDrag={onDrag}
        onStop={(event, data) => {
          setIsDragging(false);
          onDrag(event, data);
        }}
      >
        <div ref={draggableNodeRef} className="pointer-events-auto absolute left-0 top-0">
          <Resizable
            size={windowSize}
            minWidth={MIN_WIDTH}
            maxWidth={Math.min(MAX_WIDTH, viewport.width)}
            minHeight={MIN_HEIGHT}
            maxHeight={getMaxHeight(viewport)}
            onResizeStart={() => {
              resizeStartRef.current = {
                position: positionRef.current,
                size: sizeRef.current,
              };
              setIsResizing(true);
            }}
            onResize={(_event, direction, _element, delta) => applyResize(direction, delta.width, delta.height)}
            onResizeStop={() => setIsResizing(false)}
            enable={{
              top: false,
              right: true,
              bottom: true,
              left: false,
              topRight: false,
              bottomRight: true,
              bottomLeft: false,
              topLeft: false,
            }}
            handleClasses={{
              right: 'xyne-resize-handle-right',
              bottom: 'xyne-resize-handle-bottom',
              bottomRight: 'xyne-resize-handle-bottom-right',
            }}
          >
            {renderWindowContent()}
          </Resizable>
        </div>
      </Draggable>
    </div>,
    document.body,
  );
};
