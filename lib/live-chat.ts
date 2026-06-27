import { type ViewProWidgetAgent } from '@/components/view-pro-widget-provider';

export type LiveChatContext = {
  body?: string;
  stockNumber?: string;
  unitTitle?: string;
};

export const DEFAULT_CHAT_BODY = 'class-b';
export const SPECIALIST_CONNECTING_MESSAGE = 'Connecting you with a specialist...';
export const SPECIALIST_HANDOFF_DECLINED_MESSAGE =
  "No specialist was available to join right now. I'm still here to help — what would you like to know?";
export const HANDOFF_WAIT_TIMEOUT_MS = 120_000;
export const SESSION_POLL_MS = 3_000;

export type VisibleChatMessage = {
  id: string;
  senderType: 'ai' | 'agent' | 'customer' | 'system';
  senderId?: string;
  message: string;
  createdAt: Date;
};

export function sortChatMessages<T extends VisibleChatMessage>(messages: T[]): T[] {
  return [...messages].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

/** Hide AI messages once a human specialist owns the conversation. */
export function filterVisibleChatMessages<T extends VisibleChatMessage>(
  messages: T[],
  agentJoinedAt?: string | null,
): T[] {
  const joinedAt = agentJoinedAt ? new Date(agentJoinedAt).getTime() : null;

  return messages.filter((message) => {
    if (message.senderType !== 'ai') return true;
    if (joinedAt == null) return true;
    return message.createdAt.getTime() <= joinedAt;
  });
}

export function buildChatApiBody(
  context: LiveChatContext | undefined,
  fields: Record<string, string | undefined>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value != null && value !== '') out[key] = value;
  }
  // Viewed-unit context for the AI only — not applied as inventory search filters.
  if (context?.body?.trim()) out.viewedBody = context.body.trim();
  if (context?.stockNumber?.trim()) out.viewedStockNumber = context.stockNumber.trim();
  if (context?.unitTitle?.trim()) out.viewedUnitTitle = context.unitTitle.trim();
  // Single-product showroom: hard-lock the AI to the Entegra Centurion so it only
  // answers about these units (enforced server-side in ragChat.service.js).
  out.aiScope = "entegra-centurion";
  return out;
}

type ApiAgentRow = {
  id?: string;
  username?: string;
  name?: string;
  avatar?: string;
  status?: string;
};

export function mapApiAgent(agent: ApiAgentRow | null | undefined): ViewProWidgetAgent | null {
  if (!agent?.username && !agent?.name) return null;
  return {
    username: agent.username ?? agent.name ?? 'agent',
    name: agent.name ?? agent.username ?? 'Agent',
    avatar: agent.avatar ?? '',
    status: agent.status ?? 'live',
  };
}

export function mapApiChatSession(row: {
  id: string;
  status: string;
  agent_id?: string | null;
  agent_joined_at?: string | null;
  created_at: string;
  updated_at: string;
}) {
  return {
    id: row.id,
    status: row.status as 'ai' | 'waiting' | 'agent' | 'closed',
    agentId: row.agent_id ?? undefined,
    agentJoinedAt: row.agent_joined_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
