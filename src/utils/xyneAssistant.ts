import { AssistantIntent, BulkSetupItem, PRDraftState } from '../types/ai.types';

const WORD_TO_NUMBER: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  dozen: 12,
  twenty: 20,
};

const OFFICE_LOCATIONS = ['Mumbai office', 'Bangalore office', 'Delhi office', 'Pune office'];

export const REFERENCE_DATE = new Date('2026-03-17T00:00:00+05:30');

export function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatLongDate(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function detectIntent(input: string): AssistantIntent {
  const text = input.toLowerCase();

  if (text.includes('budget') || text.includes('spend')) return 'budget';
  if (text.includes('task')) return 'tasks';
  if (text.includes('quote comparison') || text.includes('compare quote')) return 'quote-comparison';
  if (text.includes('vendor') || text.includes('quote')) return 'vendors';
  if (text.includes('approval') || text.includes('approve') || text.includes('reject')) return 'approvals';
  if (text.includes('set up') || text.includes('setup') || text.includes('office')) return 'bulk-setup';
  if (
    text.includes('purchase request') ||
    text.includes('create pr') ||
    text.includes('create new pr') ||
    text.includes('need ') ||
    text.includes('buy ') ||
    /\b\d+\s+[a-z]/.test(text)
  ) {
    return 'create-pr';
  }

  return 'unknown';
}

function extractQuantity(text: string) {
  const digitMatch = text.match(/\b(\d+)\b/);
  if (digitMatch) return Number(digitMatch[1]);

  for (const [word, value] of Object.entries(WORD_TO_NUMBER)) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(text)) return value;
  }

  return undefined;
}

function normalizeLocation(text: string) {
  const lower = text.toLowerCase();

  if (lower.includes('mumbai')) return 'Mumbai office';
  if (lower.includes('bangalore')) return 'Bangalore office';
  if (lower.includes('delhi')) return 'Delhi office';
  if (lower.includes('pune')) return 'Pune office';

  return OFFICE_LOCATIONS.find((location) => lower.includes(location.toLowerCase()));
}

function normalizeItemName(text: string) {
  const lower = text.toLowerCase();

  if (lower.includes('standing desk')) return 'Standing Desks';
  if (lower.includes('ergonomic chair')) return 'Ergonomic Office Chairs';
  if (lower.includes('chair')) return 'Office Chairs';
  if (lower.includes('desk')) return 'Office Desks';
  if (lower.includes('laptop')) return 'Dell Latitude Laptops';
  if (lower.includes('whiteboard')) return 'Magnetic Whiteboard';
  if (lower.includes('projector')) return 'Projector';
  if (lower.includes('coffee machine')) return 'Coffee Machine';

  const cleaned = lower
    .replace(/\b(i need|need|buy|for|around|office|create|pr)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned ? toTitleCase(cleaned) : undefined;
}

function extractUnitPrice(text: string) {
  const explicit = text.match(/(?:around|approx(?:imately)?|about)?\s*₹?\s?(\d[\d,]*)\s*(?:per|\/)/i);
  if (explicit) return Number(explicit[1].replace(/,/g, ''));

  const standalone = text.match(/₹\s?(\d[\d,]*)/i);
  if (standalone) return Number(standalone[1].replace(/,/g, ''));

  return undefined;
}

export function resolveDatePhrase(text: string, referenceDate = REFERENCE_DATE) {
  const lower = text.toLowerCase();

  if (lower.includes('end of month')) {
    return '2026-03-31';
  }

  const aprilMatch = lower.match(/april\s+(\d{1,2})/);
  if (aprilMatch) {
    return `2026-04-${aprilMatch[1].padStart(2, '0')}`;
  }

  const marchMatch = lower.match(/march\s+(\d{1,2})/);
  if (marchMatch) {
    return `2026-03-${marchMatch[1].padStart(2, '0')}`;
  }

  if (lower.includes('today')) {
    return referenceDate.toISOString().split('T')[0];
  }

  if (lower.includes('tomorrow')) {
    const tomorrow = new Date(referenceDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  return undefined;
}

export function extractRequirements(text: string) {
  const lower = text.toLowerCase();
  const requirements: string[] = [];

  if (lower.includes('ergonomic')) requirements.push('Ergonomic');
  if (lower.includes('executive')) requirements.push('Executive');
  if (lower.includes('conference')) requirements.push('Conference');
  if (lower.includes('task chair')) requirements.push('Task chair');
  if (lower.includes('white')) requirements.push('White finish');
  if (lower.includes('black')) requirements.push('Black finish');
  if (lower.includes('warranty')) requirements.push('Warranty required');

  return requirements;
}

export function mergePRDraft(current: PRDraftState | undefined, text: string): PRDraftState {
  const next: PRDraftState = { ...(current ?? {}) };
  const quantity = extractQuantity(text);
  const itemName = normalizeItemName(text);
  const unitPrice = extractUnitPrice(text);
  const requiredBy = resolveDatePhrase(text);
  const location = normalizeLocation(text);
  const requirements = extractRequirements(text);

  if (quantity) next.quantity = quantity;
  if (itemName) {
    next.itemName = itemName;
    next.normalizedItemName = itemName;
  }
  if (unitPrice) next.unitPrice = unitPrice;
  if (requiredBy) next.requiredBy = requiredBy;
  if (location) {
    next.location = location;
    next.deliveryAddress = location;
  }
  if (requirements.length > 0) {
    next.requirements = Array.from(new Set([...(next.requirements ?? []), ...requirements]));
  }

  if (!next.category) {
    if ((next.itemName ?? '').toLowerCase().includes('chair') || (next.itemName ?? '').toLowerCase().includes('desk')) {
      next.category = 'Furniture & Fixtures';
    } else if ((next.itemName ?? '').toLowerCase().includes('laptop') || (next.itemName ?? '').toLowerCase().includes('projector')) {
      next.category = 'IT Equipment';
    } else {
      next.category = 'General Procurement';
    }
  }

  if (!next.title && next.itemName && next.quantity) {
    next.title = `${next.itemName} x ${next.quantity}`;
  }

  return next;
}

export function parseSelectionNumbers(text: string) {
  const indexes = new Set<number>();
  const lower = text.toLowerCase();

  if (lower.includes('first')) indexes.add(0);
  if (lower.includes('second')) indexes.add(1);
  if (lower.includes('third')) indexes.add(2);

  const numericMatches = lower.match(/\b\d+\b/g) ?? [];
  numericMatches.forEach((value) => {
    const index = Number(value) - 1;
    if (index >= 0) indexes.add(index);
  });

  if (lower.includes('first two')) {
    indexes.add(0);
    indexes.add(1);
  }

  return Array.from(indexes).sort((a, b) => a - b);
}

export function parseBulkSetupItems(text: string): BulkSetupItem[] {
  const normalized = text
    .replace(/\band\b/gi, ',')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  return normalized
    .map((chunk) => {
      const quantity = extractQuantity(chunk) ?? 1;
      const lower = chunk.toLowerCase();

      if (lower.includes('chair')) {
        return { name: 'Office chairs', quantity, category: 'Furniture' as const };
      }
      if (lower.includes('desk')) {
        return { name: 'Standing desks', quantity, category: 'Furniture' as const };
      }
      if (lower.includes('laptop')) {
        return { name: 'Laptops', quantity, category: 'IT Equipment' as const };
      }
      if (lower.includes('whiteboard')) {
        return { name: 'Whiteboard', quantity, category: 'IT Equipment' as const };
      }
      if (lower.includes('projector')) {
        return { name: 'Projector', quantity, category: 'IT Equipment' as const };
      }
      if (lower.includes('coffee machine')) {
        return { name: 'Coffee machine', quantity, category: 'Pantry' as const };
      }

      return undefined;
    })
    .filter((item): item is BulkSetupItem => Boolean(item));
}

export function toTitleCase(value: string) {
  return value.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}
