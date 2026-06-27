export type ChatIntent = 'price' | 'availability' | 'financing' | 'trade' | 'walkthrough' | 'general';

export type QuickReplyChip = {
  label: string;
  message: string;
};

/** A suggestion from the API: either a bare label or a {label, message} pair. */
export type ApiSuggestion = string | { label?: string; message?: string };

const QUICK_REPLY_CATALOG: Record<string, string> = {
  'Camper Van': "I'm interested in camper vans.",
  'Show All Vans': 'Show me all your camper vans.',
  'Class C': 'Show me Class C motorhomes.',
  'Class A': 'Show me Class A motorhomes.',
  'Class A Diesel': 'Do you have Class A diesel pushers?',
  'Under $100k': 'What do you have under $100,000?',
  'Financing Options': 'What financing options do you offer?',
  Financing: 'What financing options do you offer?',
  'New or Used': 'Are you looking for new or pre-owned?',
  'Talk to Specialist': 'I would like to speak with a live specialist.',
  'Connect Specialist': 'I would like to speak with a live specialist.',
  'Live Walkthrough': "I'd like a live walkthrough of a unit.",
  'Video Walkaround': "I'd like a video walkaround of a van.",
  Pricing: "I'm interested in pricing on your RVs.",
  Availability: "What's available on your lot right now?",
  Winnebago: 'Show me Winnebago camper vans.',
  Storyteller: 'Show me Storyteller Overland camper vans.',
  Solis: 'Show me Winnebago Solis camper vans.',
  Travato: 'Show me Winnebago Travato camper vans.',
  Revel: 'Show me Winnebago Revel camper vans.',
};

const DEFAULT_QUICK_REPLIES: QuickReplyChip[] = [
  { label: 'Camper Van', message: QUICK_REPLY_CATALOG['Camper Van'] },
  { label: 'Class C', message: QUICK_REPLY_CATALOG['Class C'] },
  { label: 'Class A Diesel', message: QUICK_REPLY_CATALOG['Class A Diesel'] },
  { label: 'Under $100k', message: QUICK_REPLY_CATALOG['Under $100k'] },
  { label: 'Financing Options', message: QUICK_REPLY_CATALOG['Financing Options'] },
];

export function suggestionLabelsToQuickReplies(labels: string[]): QuickReplyChip[] {
  return normalizeApiSuggestions(labels);
}

/**
 * Normalize API suggestions (bare labels or {label, message} pairs) into chips.
 * Structured messages from the backend already carry conversation context
 * (category + location); bare labels fall back to the local catalog.
 */
export function normalizeApiSuggestions(items?: ApiSuggestion[]): QuickReplyChip[] {
  if (!items?.length) return [];
  const chips: QuickReplyChip[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const label = (typeof item === 'string' ? item : item?.label ?? '').trim();
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const structuredMessage = typeof item === 'string' ? '' : (item?.message ?? '').trim();
    chips.push({
      label,
      message: structuredMessage || QUICK_REPLY_CATALOG[label] || label,
    });
  }
  return chips.slice(0, 5);
}

export function buildCustomerQuickReplies(
  customerMessage: string,
  apiSuggestions?: ApiSuggestion[],
): QuickReplyChip[] {
  if (apiSuggestions?.length) {
    const fromApi = normalizeApiSuggestions(apiSuggestions);
    if (fromApi.length >= 3) return fromApi;
  }

  const intent = detectChatIntent(customerMessage);
  switch (intent) {
    case 'price':
      return [
        { label: 'Camper Van', message: QUICK_REPLY_CATALOG['Camper Van'] },
        { label: 'Class C', message: QUICK_REPLY_CATALOG['Class C'] },
        { label: 'Class A Diesel', message: QUICK_REPLY_CATALOG['Class A Diesel'] },
        { label: 'Under $100k', message: QUICK_REPLY_CATALOG['Under $100k'] },
        { label: 'Financing Options', message: QUICK_REPLY_CATALOG['Financing Options'] },
      ];
    case 'financing':
      return [
        { label: 'Monthly Payment', message: 'What would my monthly payment look like?' },
        { label: 'Trade-In', message: 'I have a trade-in to apply.' },
        { label: 'Talk to Specialist', message: QUICK_REPLY_CATALOG['Talk to Specialist'] },
        { label: 'Under $100k', message: QUICK_REPLY_CATALOG['Under $100k'] },
        { label: 'Camper Van', message: QUICK_REPLY_CATALOG['Camper Van'] },
      ];
    case 'availability':
      return [
        { label: 'Camper Van', message: QUICK_REPLY_CATALOG['Camper Van'] },
        { label: 'Class C', message: QUICK_REPLY_CATALOG['Class C'] },
        { label: 'New or Used', message: QUICK_REPLY_CATALOG['New or Used'] },
        { label: 'Live Walkthrough', message: QUICK_REPLY_CATALOG['Live Walkthrough'] },
        { label: 'Talk to Specialist', message: QUICK_REPLY_CATALOG['Talk to Specialist'] },
      ];
    default:
      return DEFAULT_QUICK_REPLIES;
  }
}

const SPECIALIST_ONLY =
  /\b(connect you with a specialist|specialist to confirm|have a specialist|someone live|live specialist)\b/i;

const EMPTY_INVENTORY_LIST_REPLY =
  /no units match those filters|don't match those filters|\bno units match\b/i;

export function detectChatIntent(text: string): ChatIntent {
  const lower = text.toLowerCase();
  if (/\b(price|pricing|best price|msrp|cost|how much|quote)\b/.test(lower)) return 'price';
  if (/\b(available|availability|in stock|on the lot)\b/.test(lower)) return 'availability';
  if (/\b(financ|payment|monthly|apr|loan)\b/.test(lower)) return 'financing';
  if (/\b(trade|trade-in|trade in)\b/.test(lower)) return 'trade';
  if (/\b(walkthrough|video|tour|see it live)\b/.test(lower)) return 'walkthrough';
  return 'general';
}

export function intentLabel(intent: ChatIntent): string {
  switch (intent) {
    case 'price':
      return 'PRICE';
    case 'availability':
      return 'AVAILABILITY';
    case 'financing':
      return 'FINANCE';
    case 'trade':
      return 'TRADE';
    case 'walkthrough':
      return 'VIDEO';
    default:
      return 'GENERAL';
  }
}

export function isSpecialistTransferOnly(text: string): boolean {
  return SPECIALIST_ONLY.test(text);
}

/** Replace generic specialist-deflection replies with context-gathering responses. */
export function enrichCustomerAiReply(customerMessage: string, aiReply: string): string {
  const trimmed = aiReply.trim();
  if (!trimmed) return trimmed;

  if (EMPTY_INVENTORY_LIST_REPLY.test(trimmed)) {
    const lower = customerMessage.toLowerCase();
    if (/\b(van|class b|camper)\b/.test(lower) && /\b(\d{2,3}\s*k|thousand|\$\s*\d)/.test(lower)) {
      return "I didn't find an exact match at that price on our lot right now. I can show you the closest options we do have — are you looking for a camping van or a larger motorhome?";
    }
    return "I didn't find an exact match on our lot for that. What type of RV are you looking for, and are you shopping new or pre-owned?";
  }

  if (!isSpecialistTransferOnly(trimmed)) {
    return trimmed;
  }

  const intent = detectChatIntent(customerMessage);
  const vehicle = extractVehicleName(customerMessage);

  switch (intent) {
    case 'price':
      return vehicle
        ? `I'd be happy to help with pricing on the ${vehicle}. Which floorplan are you looking at — for example 59K, 59KL, or another model? I can also connect you with a specialist to verify today's best available price once we narrow it down.`
        : "I'd be happy to help with pricing. Which unit or floorplan are you interested in? Once I know that, I can share more detail or connect you with a specialist for today's best available price.";
    case 'availability':
      return vehicle
        ? `I can help check availability on the ${vehicle}. Are you looking for new or pre-owned, and do you have a preferred floorplan?`
        : 'Which model or floorplan are you interested in? I can help check what we have available.';
    case 'financing':
      return 'I can help with financing options. Are you looking for monthly payment estimates, or do you want to speak with a specialist about rates and terms?';
    case 'trade':
      return 'I can help with trade-in value. Do you have the year, make, and model of your current unit?';
    case 'walkthrough':
      return 'I can arrange a live walkthrough. Which unit would you like to see, and are you available for a video tour today?';
    default:
      return trimmed;
  }
}

function extractVehicleName(text: string): string | null {
  const match = text.match(/\b(travato|sprinter|class [abc]|winnebago|jayco|mercedes)\b/i);
  return match ? match[0].charAt(0).toUpperCase() + match[0].slice(1).toLowerCase() : null;
}

export function buildAgentSuggestions(customerMessage: string): string[] {
  const intent = detectChatIntent(customerMessage);
  const vehicle = extractVehicleName(customerMessage);

  switch (intent) {
    case 'price':
      return [
        vehicle
          ? `Which ${vehicle} floorplan are you interested in — 59K, 59KL, or another?`
          : 'Which floorplan are you interested in?',
        'Are you looking for new or pre-owned?',
        'Do you have a trade-in?',
        'Will you be paying cash or financing?',
        vehicle
          ? `Let me verify today's incentives on the ${vehicle} for you.`
          : 'Let me verify today\'s incentives for you.',
      ];
    case 'availability':
      return [
        vehicle ? `Which ${vehicle} configuration are you looking for?` : 'Which model are you interested in?',
        'Are you looking for new or pre-owned?',
        'Do you have a preferred stock number or floorplan?',
        'Would you like me to send matching units from our inventory?',
      ];
    case 'financing':
      return [
        'Are you looking for monthly payment estimates?',
        'Do you have a down payment amount in mind?',
        'Do you have a trade-in to apply?',
        'Would you like me to connect you with our finance team?',
      ];
    case 'trade':
      return [
        'What is the year, make, and model of your trade?',
        'Do you know the approximate mileage?',
        'Are you trading toward a specific unit on our lot?',
        'Would you like a formal appraisal from our team?',
      ];
    case 'walkthrough':
      return [
        'Which unit would you like to see on video?',
        'Are you available for a live walkthrough today?',
        'Would you prefer video chat or an in-person appointment?',
      ];
    default:
      return [
        'What specific unit or floorplan are you interested in?',
        'Are you looking for new or pre-owned?',
        'Do you have a trade-in or financing questions?',
        'How can I help move this conversation forward today?',
      ];
  }
}

export function mergeActionableSuggestions(apiSuggestions: string[], customerMessage: string): string[] {
  const deduped: string[] = [];
  const seen = new Set<string>();

  const add = (value: string) => {
    const normalized = value.trim();
    if (!normalized) return;
    const key = normalized.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(normalized);
  };

  const fallback = buildAgentSuggestions(customerMessage);
  const apiUseful = apiSuggestions.filter((s) => !isSpecialistTransferOnly(s));

  if (apiUseful.length >= 2) {
    apiUseful.forEach(add);
    fallback.forEach(add);
  } else {
    fallback.forEach(add);
    apiSuggestions.forEach(add);
  }

  return deduped.slice(0, 5);
}
