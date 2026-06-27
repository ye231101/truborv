'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Bot, Loader2, MessageSquare, Sparkles, User, X } from 'lucide-react';
import { type ViewProWidgetAgent, useViewProWidget } from '@/components/view-pro-widget-provider';
import { formatChatTime } from '@/lib/utils';
import { api } from '@/lib/api';
import { SSE_URL, AVATAR_URL } from '@/lib/constants';
import {
  buildChatApiBody,
  filterVisibleChatMessages,
  HANDOFF_WAIT_TIMEOUT_MS,
  mapApiAgent,
  mapApiChatSession,
  SESSION_POLL_MS,
  sortChatMessages,
  SPECIALIST_CONNECTING_MESSAGE,
  type LiveChatContext,
} from '@/lib/live-chat';
import { buildCustomerQuickReplies, enrichCustomerAiReply, type ApiSuggestion } from '@/lib/chat-intelligence';
import { type ChatGPTResponse, mapInventoryItem, type InventoryItem, type InventoryUnit } from '@/lib/types';
import { ChatAiMessageBody } from '@/components/chat-ai-message-body';
import { ChatContactCollectCard } from '@/components/chat-contact-collect';
import { ChatInventoryCarousel } from '@/components/chat-inventory-carousel';
import { ChatQuickReplies } from '@/components/chat-quick-replies';
import {
  COLLECT_ORDER,
  LIABILITY_COLLECT_ORDER,
  contactIntakeSchema,
  nextCollectPrompt,
  SPECIALIST_CONTACT_COMPLETE_MESSAGE,
  LIABILITY_CONTACT_COMPLETE_MESSAGE,
  type CollectField,
  type ContactIntakeForm,
  type ContactLead,
} from '@/lib/chat-contact-intake';
import Image from 'next/image';

const AI_CONCIERGE_GREETING = 'Hi,👋 What information can I get you today?';
const AI_FALLBACK_MESSAGE =
  "I'm having trouble responding right now. Please try again in a moment, or ask to speak with a specialist.";

const CONCIERGE_WELCOME_PENDING_ID = 'concierge-welcome-pending';

type ChatSession = {
  id: string;
  status: 'ai' | 'wait' | 'waiting' | 'agent' | 'closed';
  agentId?: string;
  agentJoinedAt?: string;
  createdAt: string;
  updatedAt: string;
};

type ChatMessage = {
  id: string;
  senderType: 'ai' | 'agent' | 'customer' | 'system';
  senderId?: string;
  message: string;
  createdAt: Date;
  inventories?: InventoryUnit[];
  carouselLabel?: string;
  suggestions?: ApiSuggestion[];
};

type AiReplyMeta = {
  inventories?: InventoryUnit[];
  suggestions?: ApiSuggestion[];
  carouselLabel?: string;
};

function mapInventories(items?: InventoryItem[]): InventoryUnit[] | undefined {
  if (!items?.length) return undefined;
  return items.map(mapInventoryItem);
}

type ApiChatMessageRow = {
  id: string;
  sender_type: ChatMessage['senderType'];
  sender_id?: string | null;
  message: string;
  created_at: string;
};

function createConciergeWelcomeMessage(): ChatMessage {
  return {
    id: CONCIERGE_WELCOME_PENDING_ID,
    senderType: 'ai',
    message: AI_CONCIERGE_GREETING,
    createdAt: new Date(),
  };
}

function replaceConciergeWelcome(prev: ChatMessage[], welcome: ChatMessage): ChatMessage[] {
  const withoutPendingOrDuplicate = prev.filter(
    (m) => m.id !== CONCIERGE_WELCOME_PENDING_ID && m.id !== welcome.id,
  );
  return [...withoutPendingOrDuplicate, welcome];
}

function mergeIncomingChatMessage(prev: ChatMessage[], incoming: ChatMessage): ChatMessage[] {
  let next = prev;
  if (incoming.senderType === 'customer') {
    next = prev.filter(
      (m) =>
        !(m.senderType === 'customer' && m.id !== incoming.id && m.message === incoming.message),
    );
  }
  const idx = next.findIndex((m) => m.id === incoming.id);
  if (idx === -1) return [...next, incoming];
  const updated = [...next];
  const existing = updated[idx];
  updated[idx] = {
    ...incoming,
    ...(incoming.inventories?.length
      ? {}
      : existing.inventories?.length
        ? { inventories: existing.inventories }
        : {}),
    ...(incoming.carouselLabel
      ? {}
      : existing.carouselLabel
        ? { carouselLabel: existing.carouselLabel }
        : {}),
    ...(incoming.suggestions?.length
      ? {}
      : existing.suggestions?.length
        ? { suggestions: existing.suggestions }
        : {}),
  };
  return updated;
}

function finalizeAiChatMessage(
  message: ChatMessage,
  customerMessage: string,
  existing?: ChatMessage,
  apiMeta?: AiReplyMeta,
): ChatMessage {
  if (message.senderType !== 'ai') return message;
  const inventories =
    message.inventories?.length
      ? message.inventories
      : apiMeta?.inventories?.length
        ? apiMeta.inventories
        : existing?.inventories;
  const carouselLabel =
    message.carouselLabel ?? apiMeta?.carouselLabel ?? existing?.carouselLabel;
  const suggestions =
    message.suggestions?.length
      ? message.suggestions
      : apiMeta?.suggestions?.length
        ? apiMeta.suggestions
        : existing?.suggestions;

  return {
    ...message,
    message: enrichCustomerAiReply(customerMessage, message.message),
    ...(inventories?.length ? { inventories } : {}),
    ...(carouselLabel ? { carouselLabel } : {}),
    ...(suggestions?.length ? { suggestions } : {}),
  };
}

function chatMessageFromApi(
  row: ApiChatMessageRow,
  extras?: { inventories?: InventoryUnit[] },
): ChatMessage {
  return {
    id: row.id,
    senderType: row.sender_type,
    senderId: row.sender_id ?? undefined,
    message: row.message,
    createdAt: new Date(row.created_at),
    ...(extras?.inventories?.length ? { inventories: extras.inventories } : {}),
  };
}

function mergeChatMessagesFromApi(prev: ChatMessage[], rows: ApiChatMessageRow[]): ChatMessage[] {
  const sorted = [...rows].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
  let next = prev.filter((m) => m.id !== CONCIERGE_WELCOME_PENDING_ID);
  for (const row of sorted) {
    const incoming = chatMessageFromApi(row);
    if (incoming.senderType === 'ai' && incoming.message === AI_CONCIERGE_GREETING) {
      next = replaceConciergeWelcome(next, incoming);
    } else {
      next = mergeIncomingChatMessage(next, incoming);
    }
  }
  return sortChatMessages(next);
}

function ChatTypingDots() {
  return (
    <div className="flex items-center gap-1 px-0.5 py-0.5" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 rounded-full bg-neutral-400 motion-safe:animate-bounce motion-reduce:animate-none motion-reduce:opacity-90"
          style={{ animationDelay: `${i * 140}ms` }}
        />
      ))}
    </div>
  );
}

export type { LiveChatContext };

type LiveChatDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatContext?: LiveChatContext;
};

export function LiveChatDialog({ open, onOpenChange, chatContext }: LiveChatDialogProps) {
  const { agents: liveAgents } = useViewProWidget();
  const liveAgentCount = liveAgents.filter((a) => a.status === 'live').length;
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [intakeComplete, setIntakeComplete] = useState(true);
  const [activeCollectField, setActiveCollectField] = useState<CollectField | null>(null);
  const [isChatClosed, setIsChatClosed] = useState(false);
  const [agent, setAgent] = useState<ViewProWidgetAgent | null>(null);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isHandingOff, setIsHandingOff] = useState(false);
  const [awaitingAiReply, setAwaitingAiReply] = useState(false);
  const [awaitingSpecialist, setAwaitingSpecialist] = useState(false);
  const [salesIntentActive, setSalesIntentActive] = useState(false);
  const [liabilityIntake, setLiabilityIntake] = useState(false);
  const [specialistsUnavailable, setSpecialistsUnavailable] = useState(false);
  const [handoffTimedOut, setHandoffTimedOut] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<ChatSession | null>(null);
  const agentRef = useRef<ViewProWidgetAgent | null>(null);
  const chatContextRef = useRef(chatContext);
  const handoffStartedAtRef = useRef<number | null>(null);
  const awaitingSpecialistRef = useRef(false);
  const lastCustomerMessageRef = useRef('');
  const aiMetaByMessageIdRef = useRef<Map<string, AiReplyMeta>>(new Map());
  const leadRef = useRef<ContactLead>({ name: '', email: '', phone: '', callTime: '' });
  const intakeCompleteRef = useRef(true);
  const liabilityIntakeRef = useRef(false);

  const {
    register: registerIntake,
    watch: watchIntake,
    trigger: triggerIntake,
    setValue: setIntakeValue,
    getValues: getIntakeValues,
    reset: resetIntakeForm,
    formState: { errors: intakeErrors },
  } = useForm<ContactIntakeForm>({
    resolver: zodResolver(contactIntakeSchema),
    defaultValues: { name: '', email: '', phone: '', callTime: '' },
    mode: 'onSubmit',
  });

  useEffect(() => {
    chatContextRef.current = chatContext;
  }, [chatContext]);

  useEffect(() => {
    intakeCompleteRef.current = intakeComplete;
  }, [intakeComplete]);

  useEffect(() => {
    awaitingSpecialistRef.current = awaitingSpecialist;
  }, [awaitingSpecialist]);

  useEffect(() => {
    liabilityIntakeRef.current = liabilityIntake;
  }, [liabilityIntake]);

  const upsertChatMessage = useCallback((nextMessage: ChatMessage) => {
    setChatMessages((prev) => sortChatMessages(mergeIncomingChatMessage(prev, nextMessage)));
  }, []);

  const startSpecialistContactIntake = useCallback(() => {
    setLiabilityIntake(false);
    liabilityIntakeRef.current = false;
    setIntakeComplete(false);
    setActiveCollectField('name');
    intakeCompleteRef.current = false;
  }, []);

  const startLiabilityContactIntake = useCallback(() => {
    setLiabilityIntake(true);
    liabilityIntakeRef.current = true;
    setIntakeComplete(false);
    setActiveCollectField('name');
    intakeCompleteRef.current = false;
  }, []);

  const resetContactIntake = useCallback(() => {
    setIntakeComplete(true);
    setActiveCollectField(null);
    setLiabilityIntake(false);
    liabilityIntakeRef.current = false;
    leadRef.current = { name: '', email: '', phone: '', callTime: '' };
    intakeCompleteRef.current = true;
    resetIntakeForm({ name: '', email: '', phone: '', callTime: '' });
  }, [resetIntakeForm]);

  const persistContactToSession = useCallback(async (lead: ContactLead) => {
    const sessionId = chatSessionRef.current?.id;
    if (!sessionId) return;
    try {
      await api.patch(
        `chat/${sessionId}/contact`,
        {
          name: lead.name,
          ...(lead.email ? { email: lead.email } : {}),
          phone_number: lead.phone,
          ...(lead.callTime ? { preferred_call_time: lead.callTime } : {}),
        },
        { silent: true },
      );
    } catch (error) {
      console.error('Error saving contact info:', error);
    }
  }, []);

  const submitCollectField = useCallback(
    async (field: CollectField) => {
      setIntakeValue(field, getIntakeValues(field), { shouldValidate: false });
      const valid = await triggerIntake(field);
      if (!valid) return;

      const text = getIntakeValues(field).trim();
      leadRef.current[field] = text;
      upsertChatMessage({
        id: crypto.randomUUID(),
        senderType: 'customer',
        message: text,
        createdAt: new Date(),
      });
      setIntakeValue(field, '');

      const collectOrder = liabilityIntakeRef.current ? LIABILITY_COLLECT_ORDER : COLLECT_ORDER;
      const fieldIndex = collectOrder.indexOf(field);
      const nextField = collectOrder[fieldIndex + 1];

      if (nextField) {
        const prompt = nextCollectPrompt(nextField, leadRef.current.name, {
          liability: liabilityIntakeRef.current,
        });
        upsertChatMessage({
          id: crypto.randomUUID(),
          senderType: 'ai',
          message: prompt.prompt,
          createdAt: new Date(),
        });
        setActiveCollectField(nextField);
        return;
      }

      await persistContactToSession(leadRef.current);
      setIntakeComplete(true);
      setActiveCollectField(null);
      upsertChatMessage({
        id: crypto.randomUUID(),
        senderType: 'ai',
        message: liabilityIntakeRef.current
          ? LIABILITY_CONTACT_COMPLETE_MESSAGE
          : SPECIALIST_CONTACT_COMPLETE_MESSAGE,
        createdAt: new Date(),
      });
    },
    [getIntakeValues, persistContactToSession, setIntakeValue, triggerIntake, upsertChatMessage],
  );

  const isAiMode = useCallback(() => {
    const session = chatSessionRef.current;
    return session?.status === 'ai' && !agentRef.current;
  }, []);

  const applyAgentJoined = useCallback(
    (joinedAgent: ViewProWidgetAgent | null, sessionRow?: { agent_joined_at?: string | null }) => {
      if (!joinedAgent || agentRef.current) return;

      agentRef.current = joinedAgent;
      setAgent(joinedAgent);
      setAwaitingAiReply(false);
      setAwaitingSpecialist(false);
      setSalesIntentActive(false);
      setSpecialistsUnavailable(false);
      setHandoffTimedOut(false);
      handoffStartedAtRef.current = null;
      resetContactIntake();
      const joinedAt = sessionRow?.agent_joined_at ?? new Date().toISOString();
      setChatSession((prev) => (prev ? { ...prev, status: 'agent', agentJoinedAt: joinedAt } : prev));
      setChatMessages((prev) =>
        sortChatMessages(
          filterVisibleChatMessages(
            [
              ...prev.filter(
                (m) =>
                  m.id !== 'system-agent-joined' &&
                  m.id !== CONCIERGE_WELCOME_PENDING_ID &&
                  !(m.senderType === 'ai' && m.message === AI_CONCIERGE_GREETING),
              ),
              {
                id: 'system-agent-joined',
                senderType: 'system',
                message: joinedAgent.name || 'Agent',
                createdAt: new Date(joinedAt),
              },
            ],
            joinedAt,
          ),
        ),
      );
    },
    [resetContactIntake],
  );

  const applyHandoffCancelled = useCallback(
    (
      sessionRow?: {
        id: string;
        status: ChatSession['status'];
        agent_id?: string | null;
        agent_joined_at?: string | null;
        created_at?: string;
        updated_at?: string;
      },
      aiMessage?: ApiChatMessageRow,
    ) => {
      setAwaitingSpecialist(false);
      setSalesIntentActive(false);
      setIsHandingOff(false);
      setHandoffTimedOut(false);
      setSpecialistsUnavailable(false);
      handoffStartedAtRef.current = null;
      resetContactIntake();

      if (sessionRow) {
        const mapped = mapApiChatSession({
          id: sessionRow.id,
          status: sessionRow.status,
          agent_id: sessionRow.agent_id,
          agent_joined_at: sessionRow.agent_joined_at,
          created_at: sessionRow.created_at ?? chatSessionRef.current?.createdAt ?? new Date().toISOString(),
          updated_at: sessionRow.updated_at ?? chatSessionRef.current?.updatedAt ?? new Date().toISOString(),
        });
        setChatSession((prev) => (prev ? { ...prev, ...mapped } : mapped));
      }

      if (aiMessage) {
        upsertChatMessage(chatMessageFromApi(aiMessage));
      }
    },
    [resetContactIntake, upsertChatMessage],
  );

  const applyHandoffResult = useCallback(
    (data: {
      aiMessage?: ApiChatMessageRow;
      inventories?: InventoryItem[];
      suggestions?: ApiSuggestion[];
      carouselLabel?: string;
      handoff?: boolean;
      salesIntent?: boolean;
      specialistsUnavailable?: boolean;
      liabilityEscalation?: boolean;
      chatSession?: {
        id: string;
        status: ChatSession['status'];
        agent_id?: string | null;
        agent_joined_at?: string | null;
        created_at?: string;
        updated_at?: string;
      };
    }) => {
      if (data.chatSession) {
        const mapped = mapApiChatSession({
          id: data.chatSession.id,
          status: data.chatSession.status,
          agent_id: data.chatSession.agent_id,
          agent_joined_at: data.chatSession.agent_joined_at,
          created_at: data.chatSession.created_at ?? chatSessionRef.current?.createdAt ?? new Date().toISOString(),
          updated_at: data.chatSession.updated_at ?? chatSessionRef.current?.updatedAt ?? new Date().toISOString(),
        });
        setChatSession((prev) => (prev ? { ...prev, ...mapped } : mapped));
      }

      if (data.handoff) {
        setAwaitingSpecialist(true);
        setSalesIntentActive(Boolean(data.salesIntent));
        setSpecialistsUnavailable(false);
        setHandoffTimedOut(false);
        handoffStartedAtRef.current = Date.now();
      } else if (data.specialistsUnavailable) {
        setAwaitingSpecialist(false);
        setSpecialistsUnavailable(true);
        handoffStartedAtRef.current = null;
        if (data.liabilityEscalation) {
          startLiabilityContactIntake();
        } else {
          startSpecialistContactIntake();
        }
      }

      if (data.aiMessage && !agentRef.current) {
        const mappedInventories = mapInventories(data.inventories);
        const apiMeta: AiReplyMeta = {
          inventories: mappedInventories,
          suggestions: data.suggestions,
          carouselLabel: data.carouselLabel,
        };
        aiMetaByMessageIdRef.current.set(data.aiMessage.id, apiMeta);
        const base = chatMessageFromApi(data.aiMessage, { inventories: mappedInventories });
        upsertChatMessage(
          finalizeAiChatMessage(base, lastCustomerMessageRef.current, undefined, apiMeta),
        );
      }
    },
    [startLiabilityContactIntake, startSpecialistContactIntake, upsertChatMessage],
  );

  const appendAiMessage = useCallback(
    async (
      sessionId: string,
      message: string,
      inventories?: InventoryUnit[],
      meta?: Pick<AiReplyMeta, 'suggestions' | 'carouselLabel'>,
    ) => {
      if (agentRef.current) return;
      const optimisticId = crypto.randomUUID();
      const apiMeta: AiReplyMeta = {
        inventories,
        suggestions: meta?.suggestions,
        carouselLabel: meta?.carouselLabel,
      };
      upsertChatMessage(
        finalizeAiChatMessage(
          {
            id: optimisticId,
            senderType: 'ai',
            message,
            createdAt: new Date(),
            inventories,
          },
          lastCustomerMessageRef.current,
          undefined,
          apiMeta,
        ),
      );
      const enrichedMessage = enrichCustomerAiReply(lastCustomerMessageRef.current, message);

      try {
        const res = await api.post(
          `chat/${sessionId}/send`,
          buildChatApiBody(chatContextRef.current, { senderType: 'ai', message: enrichedMessage }),
          { silent: true },
        );
        const { chatMessage } = res.data as { chatMessage: ApiChatMessageRow };
        aiMetaByMessageIdRef.current.set(chatMessage.id, apiMeta);
        const saved = finalizeAiChatMessage(
          chatMessageFromApi(chatMessage, {
            inventories: inventories?.length ? inventories : undefined,
          }),
          lastCustomerMessageRef.current,
          undefined,
          apiMeta,
        );
        setChatMessages((prev) =>
          mergeIncomingChatMessage(
            prev.filter((m) => m.id !== optimisticId),
            saved,
          ),
        );
      } catch (error) {
        console.error('Error saving AI reply to chat session:', error);
      }
    },
    [upsertChatMessage],
  );

  useEffect(() => {
    chatSessionRef.current = chatSession;
  }, [chatSession]);

  useEffect(() => {
    agentRef.current = agent;
  }, [agent]);

  const fetchAiReply = useCallback(async (message: string) => {
    const res = (await api.post(
      'chatgpt/chat',
      buildChatApiBody(chatContextRef.current, { message }),
      { timeout: 90_000, silent: true },
    )) as ChatGPTResponse & {
      data: {
        suggestions?: ApiSuggestion[];
        carouselLabel?: string;
      };
    };
    const rawReply = res.data.reply?.trim() ?? '';
    return {
      reply: enrichCustomerAiReply(message, rawReply || AI_FALLBACK_MESSAGE),
      inventories: mapInventories(res.data.inventories),
      suggestions: res.data.suggestions,
      carouselLabel: res.data.carouselLabel,
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setChatSession(null);
      setChatMessages([]);
      setAgent(null);
      setDraft('');
      setIsChatClosed(false);
      setAwaitingAiReply(false);
      setAwaitingSpecialist(false);
      setSpecialistsUnavailable(false);
      setHandoffTimedOut(false);
      setIsHandingOff(false);
      handoffStartedAtRef.current = null;
      resetContactIntake();
      return;
    }

    setChatMessages([createConciergeWelcomeMessage()]);

    const sendChatRequest = async () => {
      try {
        const res = await api.post('chat/request', undefined, { silent: true });
        const { chatSession: sessionRow, welcomeMessage } = res.data as {
          chatSession: {
            id: string;
            status: ChatSession['status'];
            agent_id?: string | null;
            agent_joined_at?: string | null;
            created_at: string;
            updated_at: string;
          };
          welcomeMessage?: ApiChatMessageRow;
        };
        setChatSession(mapApiChatSession(sessionRow));
        if (welcomeMessage) {
          const welcome = chatMessageFromApi(welcomeMessage);
          setChatMessages((prev) => replaceConciergeWelcome(prev, welcome));
        }
      } catch (error) {
        console.error('Error sending chat request:', error);
      }
    };
    sendChatRequest();
  }, [open, resetContactIntake]);

  const fetchChatMessages = useCallback(async () => {
    const sessionId = chatSessionRef.current?.id;
    if (!sessionId) return;

    try {
      const res = await api.get(`chat/${sessionId}/messages`, { silent: true });
      const { chatMessages: rows } = res.data as { chatMessages?: ApiChatMessageRow[] };
      if (!rows?.length) return;
      setChatMessages((prev) => {
        const merged = mergeChatMessagesFromApi(prev, rows);
        return merged.map((m) => {
          if (m.senderType !== 'ai') return m;
          const stored = aiMetaByMessageIdRef.current.get(m.id);
          const withMeta: ChatMessage = {
            ...m,
            ...(stored?.inventories?.length ? { inventories: stored.inventories } : {}),
            ...(stored?.carouselLabel ? { carouselLabel: stored.carouselLabel } : {}),
            ...(stored?.suggestions?.length ? { suggestions: stored.suggestions } : {}),
          };
          return finalizeAiChatMessage(withMeta, lastCustomerMessageRef.current, m, stored);
        });
      });
    } catch (error) {
      console.error('Error fetching chat messages:', error);
    }
  }, []);

  const pollChatSession = useCallback(async () => {
    const sessionId = chatSessionRef.current?.id;
    if (!sessionId || agentRef.current) return;

    try {
      const res = await api.get(`chat/${sessionId}`, { silent: true });
      const data = res.data as {
        chatSession: {
          id: string;
          status: ChatSession['status'];
          agent_id?: string | null;
          agent_joined_at?: string | null;
          created_at: string;
          updated_at: string;
        };
        agent?: {
          username?: string;
          name?: string;
          avatar?: string;
          status?: string;
        } | null;
      };

      const mapped = mapApiChatSession(data.chatSession);
      setChatSession((prev) => (prev ? { ...prev, ...mapped } : mapped));
      setIsChatClosed(mapped.status === 'closed');

      if (
        mapped.status === 'ai' &&
        !data.chatSession.agent_id &&
        awaitingSpecialistRef.current
      ) {
        applyHandoffCancelled(data.chatSession);
      }

      if (data.chatSession.agent_id && data.agent && !agentRef.current) {
        const joined = mapApiAgent(data.agent);
        if (joined) {
          applyAgentJoined(joined, data.chatSession);
        }
      }
    } catch (error) {
      console.error('Error polling chat session:', error);
    }
  }, [applyAgentJoined, applyHandoffCancelled]);

  useEffect(() => {
    if (!open || !awaitingSpecialist || agent) return;

    const interval = setInterval(() => {
      void pollChatSession();
    }, SESSION_POLL_MS);

    return () => clearInterval(interval);
  }, [open, awaitingSpecialist, agent, pollChatSession]);

  useEffect(() => {
    if (!open || !chatSession?.id) return;
    const withAgent = !!agent || chatSession.status === 'agent';
    if (!withAgent) return;

    void fetchChatMessages();
    const interval = setInterval(() => {
      void fetchChatMessages();
    }, SESSION_POLL_MS);

    return () => clearInterval(interval);
  }, [open, chatSession?.id, chatSession?.status, agent, fetchChatMessages]);

  useEffect(() => {
    if (!open || !awaitingSpecialist || agent) return;

    const timeout = setTimeout(() => {
      setHandoffTimedOut(true);
      setAwaitingSpecialist(false);
      handoffStartedAtRef.current = null;
      startSpecialistContactIntake();
    }, HANDOFF_WAIT_TIMEOUT_MS);

    return () => clearTimeout(timeout);
  }, [open, awaitingSpecialist, agent, startSpecialistContactIntake]);

  useEffect(() => {
    if (!open) return;

    const eventSource = new EventSource(SSE_URL);

    eventSource.addEventListener('chat:accept', (e) => {
      const res = JSON.parse(e.data) as {
        chatSessionId: string;
        chatSession: {
          id: string;
          status: ChatSession['status'];
          agent_id?: string | null;
          agent_joined_at?: string | null;
          created_at: string;
          updated_at: string;
        };
        agent?: {
          username?: string;
          name?: string;
          avatar?: string;
          status?: string;
        };
      };
      if (!chatSessionRef.current || res.chatSessionId !== chatSessionRef.current.id) return;
      setChatSession((prev) =>
        prev ? { ...prev, ...mapApiChatSession(res.chatSession) } : mapApiChatSession(res.chatSession),
      );
      const joined = mapApiAgent(res.agent);
      applyAgentJoined(joined, res.chatSession);
      void fetchChatMessages();
    });

    eventSource.addEventListener('chat:message:send', (e) => {
      const res = JSON.parse(e.data) as {
        chatSessionId: string;
        chatMessage: ApiChatMessageRow;
        inventories?: InventoryItem[];
        suggestions?: ApiSuggestion[];
        carouselLabel?: string;
      };
      if (!chatSessionRef.current || res.chatSessionId !== chatSessionRef.current.id) return;
      const senderType = res.chatMessage.sender_type;
      if (senderType === 'ai' && (agentRef.current || chatSessionRef.current.status === 'agent')) {
        return;
      }

      const mappedInventories = mapInventories(res.inventories);
      const storedMeta = aiMetaByMessageIdRef.current.get(res.chatMessage.id);
      const apiMeta: AiReplyMeta = {
        inventories: mappedInventories ?? storedMeta?.inventories,
        suggestions: res.suggestions ?? storedMeta?.suggestions,
        carouselLabel: res.carouselLabel ?? storedMeta?.carouselLabel,
      };
      aiMetaByMessageIdRef.current.set(res.chatMessage.id, apiMeta);

      let incoming = chatMessageFromApi(res.chatMessage, {
        inventories: apiMeta.inventories,
      });

      if (senderType === 'ai' && incoming.message === AI_CONCIERGE_GREETING) {
        setChatMessages((prev) => replaceConciergeWelcome(prev, incoming));
        return;
      }

      if (senderType === 'ai') {
        setChatMessages((prev) => {
          const existing = prev.find((m) => m.id === incoming.id);
          incoming = finalizeAiChatMessage(
            incoming,
            lastCustomerMessageRef.current,
            existing,
            apiMeta,
          );
          return mergeIncomingChatMessage(prev, incoming);
        });
        return;
      }

      setChatMessages((prev) => mergeIncomingChatMessage(prev, incoming));
    });

    eventSource.addEventListener('chat:session:status', (e) => {
      const res = JSON.parse(e.data) as {
        chatSessionId: string;
        status: string;
        handoffCancelled?: boolean;
        aiMessage?: ApiChatMessageRow;
        chatSession?: {
          id: string;
          status: ChatSession['status'];
          agent_id?: string | null;
          agent_joined_at?: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      if (!chatSessionRef.current || res.chatSessionId !== chatSessionRef.current.id) return;

      if (res.handoffCancelled && res.chatSession) {
        applyHandoffCancelled(res.chatSession, res.aiMessage);
        return;
      }

      if (res.chatSession) {
        setChatSession((prev) =>
          prev ? { ...prev, ...mapApiChatSession(res.chatSession!) } : mapApiChatSession(res.chatSession!),
        );

        if (
          res.status === 'ai' &&
          !res.chatSession.agent_id &&
          awaitingSpecialistRef.current
        ) {
          applyHandoffCancelled(res.chatSession, res.aiMessage);
        }
      }
      setIsChatClosed(res.status === 'closed');
    });

    return () => {
      eventSource.close();
    };
  }, [open, applyAgentJoined, applyHandoffCancelled, fetchChatMessages]);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    if (!open) return;
    scrollToBottom();
  }, [chatMessages, open, awaitingAiReply, awaitingSpecialist, scrollToBottom]);

  const requestSpecialistHandoff = useCallback(async () => {
    if (!chatSession?.id || isHandingOff || agent || isChatClosed) return;

    setIsHandingOff(true);
    setSpecialistsUnavailable(false);
    setHandoffTimedOut(false);
    try {
      const res = await api.post(`chat/${chatSession.id}/handoff`, buildChatApiBody(chatContextRef.current, {}));
      applyHandoffResult(res.data as Parameters<typeof applyHandoffResult>[0]);
    } catch (error) {
      console.error('Error requesting specialist handoff:', error);
    } finally {
      setIsHandingOff(false);
    }
  }, [agent, applyHandoffResult, chatSession?.id, isChatClosed, isHandingOff]);

  const resumeWithAi = useCallback(async () => {
    if (!chatSession?.id) return;
    try {
      const res = await api.post(`chat/${chatSession.id}/cancel-handoff`, undefined, { silent: true });
      const { chatSession: sessionRow } = res.data as {
        chatSession: {
          id: string;
          status: ChatSession['status'];
          agent_id?: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      setChatSession((prev) => (prev ? { ...prev, ...mapApiChatSession(sessionRow) } : mapApiChatSession(sessionRow)));
      setAwaitingSpecialist(false);
      setHandoffTimedOut(false);
      setSpecialistsUnavailable(false);
      handoffStartedAtRef.current = null;
      resetContactIntake();
    } catch (error) {
      console.error('Error resuming AI chat:', error);
    }
  }, [chatSession?.id, resetContactIntake]);

  const sendCustomerMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (
        !trimmed ||
        isSending ||
        awaitingAiReply ||
        isChatClosed ||
        !chatSession?.id ||
        !intakeCompleteRef.current
      ) {
        return;
      }

      lastCustomerMessageRef.current = trimmed;

      const expectsAiReply = !agentRef.current && !awaitingSpecialist && isAiMode();
      const optimisticCustomerId = crypto.randomUUID();
      upsertChatMessage({
        id: optimisticCustomerId,
        senderType: 'customer',
        message: trimmed,
        createdAt: new Date(),
      });

      setIsSending(true);
      if (expectsAiReply) setAwaitingAiReply(true);
      try {
        const res = await api.post(
          `chat/${chatSession.id}/send`,
          buildChatApiBody(chatContextRef.current, { senderType: 'customer', message: trimmed }),
          { timeout: 90_000 },
        );
        const {
          chatMessage,
          aiMessage,
          inventories,
          suggestions,
          carouselLabel,
          handoff,
          salesIntent,
          specialistsUnavailable: unavailable,
          liabilityEscalation,
          chatSession: sessionFromApi,
        } = res.data as {
          chatMessage: ApiChatMessageRow;
          aiMessage?: ApiChatMessageRow;
          inventories?: InventoryItem[];
          suggestions?: ApiSuggestion[];
          carouselLabel?: string;
          handoff?: boolean;
          salesIntent?: boolean;
          specialistsUnavailable?: boolean;
          liabilityEscalation?: boolean;
          chatSession?: {
            id: string;
            status: ChatSession['status'];
            agent_id?: string | null;
            agent_joined_at?: string | null;
            created_at?: string;
            updated_at?: string;
          };
        };
        const savedCustomer = chatMessageFromApi(chatMessage);
        setChatMessages((prev) =>
          mergeIncomingChatMessage(
            prev.filter((m) => m.id !== optimisticCustomerId),
            savedCustomer,
          ),
        );

        applyHandoffResult({
          aiMessage: agentRef.current ? undefined : aiMessage,
          inventories,
          suggestions,
          carouselLabel,
          handoff,
          salesIntent,
          specialistsUnavailable: unavailable,
          liabilityEscalation,
          chatSession: sessionFromApi,
        });

        if (!aiMessage && !agentRef.current && expectsAiReply && isAiMode()) {
          try {
            const {
              reply,
              inventories: fallbackInventories,
              suggestions: fallbackSuggestions,
              carouselLabel: fallbackCarouselLabel,
            } = await fetchAiReply(trimmed);
            await appendAiMessage(
              chatSession.id,
              reply || AI_FALLBACK_MESSAGE,
              fallbackInventories,
              {
                suggestions: fallbackSuggestions,
                carouselLabel: fallbackCarouselLabel,
              },
            );
          } catch (error) {
            console.error('Error fetching AI reply:', error);
            await appendAiMessage(chatSession.id, AI_FALLBACK_MESSAGE);
          }
        }
      } finally {
        setIsSending(false);
        if (expectsAiReply) setAwaitingAiReply(false);
      }
    },
    [
      appendAiMessage,
      applyHandoffResult,
      awaitingAiReply,
      awaitingSpecialist,
      chatSession?.id,
      fetchAiReply,
      isAiMode,
      isChatClosed,
      isSending,
      upsertChatMessage,
    ],
  );

  const handleSend = async () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setDraft('');
    await sendCustomerMessage(trimmed);
  };

  const showTalkToSpecialist =
    !!chatSession &&
    !agent &&
    !isChatClosed &&
    !awaitingSpecialist &&
    !isHandingOff &&
    liveAgentCount >= 1;

  const headerTitle = agent
    ? agent.name
    : awaitingSpecialist || isHandingOff
      ? 'Connecting…'
      : 'AI Assistant';

  const headerSubtitle =
    agent
      ? 'Specialist'
      : awaitingSpecialist || isHandingOff
        ? liveAgentCount > 0
          ? `${liveAgentCount} specialist${liveAgentCount === 1 ? '' : 's'} online`
          : 'Requesting a specialist'
        : 'Live Chat';

  const visibleMessages = useMemo(
    () =>
      sortChatMessages(
        filterVisibleChatMessages(
          chatMessages,
          agent ? chatSession?.agentJoinedAt ?? null : null,
        ),
      ),
    [agent, chatMessages, chatSession?.agentJoinedAt],
  );

  const lastAiMessageId = useMemo(() => {
    for (let i = visibleMessages.length - 1; i >= 0; i -= 1) {
      if (visibleMessages[i].senderType === 'ai') return visibleMessages[i].id;
    }
    return null;
  }, [visibleMessages]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex h-full w-full max-w-none flex-col overflow-hidden rounded-none bg-white shadow-xl sm:inset-auto sm:right-5 sm:bottom-5 sm:h-[min(90vh,720px)] sm:w-full sm:max-w-[360px] sm:rounded-xl sm:border sm:border-neutral-200"
    >
      <div className="bg-primary flex items-center gap-3 px-4 py-2.5 text-white">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          {agent?.avatar ? (
            <Image
              src={AVATAR_URL + agent.avatar}
              alt=""
              width={32}
              height={32}
              className="size-8 shrink-0 rounded-full object-cover ring-2 ring-white/30"
            />
          ) : awaitingSpecialist || isHandingOff ? (
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15">
              <Loader2 className="size-4 animate-spin" aria-hidden />
            </div>
          ) : (
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15">
              <Bot className="size-4" aria-hidden />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{headerTitle}</p>
            <p className="truncate text-xs text-white/80">{headerSubtitle}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="cursor-pointer rounded-md p-1.5 text-white/85 transition hover:bg-white/15 hover:text-white"
          aria-label="Close"
        >
          <X className="size-5 shrink-0" strokeWidth={2} />
        </button>
      </div>

      {chatContext?.unitTitle && (
        <div className="border-b border-neutral-200 bg-primary/5 px-4 py-2 text-xs text-neutral-700">
          <span className="font-medium text-neutral-900">Discussing: </span>
          {chatContext.unitTitle}
          {chatContext.stockNumber ? (
            <span className="text-neutral-500"> · #{chatContext.stockNumber}</span>
          ) : null}
        </div>
      )}

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-4 overflow-x-hidden overflow-y-auto bg-neutral-50/80 px-2 py-4"
      >
        <div className="min-w-0 space-y-2">
          {visibleMessages.map((row) =>
            row.senderType === 'system' && row.id === 'system-agent-joined' ? (
              <div key={row.id} className="flex w-full justify-center px-2">
                <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs text-neutral-600 shadow-sm ring-1 ring-neutral-200">
                  <span className="size-2 rounded-full bg-green-500" aria-hidden />
                  <span>
                    You&apos;re now chatting with{' '}
                    <span className="font-semibold text-neutral-800">{row.message}</span>
                  </span>
                </div>
              </div>
            ) : row.senderType === 'customer' ? (
              <div key={row.id} className="flex w-full min-w-0 flex-col items-end">
                <div className="max-w-[80%] min-w-0">
                  <div className="flex flex-col gap-1">
                    <p className="pr-1 text-right text-xs font-bold text-neutral-700">You</p>
                    <div className="rounded-xl bg-neutral-100 px-3 py-2.5 text-sm leading-snug wrap-break-word text-neutral-800">
                      {row.message}
                    </div>
                    <p className="pr-1 text-right text-xs text-neutral-400">{formatChatTime(row.createdAt)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div key={row.id} className="flex min-w-0">
                <div className="max-w-[80%] min-w-0">
                  {row.senderType === 'ai' ? (
                    <div className="flex max-w-full flex-row gap-2">
                      <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full">
                        <Bot className="size-6" strokeWidth={2.5} aria-hidden />
                      </div>
                      <div className="mt-1 flex min-w-0 flex-col gap-1">
                        <p className="pl-1 text-xs font-bold text-neutral-700">AI Assistant</p>
                        <div className="rounded-xl bg-neutral-100 px-3 py-2.5 wrap-break-word">
                          <ChatAiMessageBody text={row.message} />
                        </div>
                        {row.inventories && row.inventories.length > 0 ? (
                          <ChatInventoryCarousel
                            units={row.inventories}
                            label={row.carouselLabel}
                          />
                        ) : null}
                        {row.id === lastAiMessageId &&
                        row.suggestions &&
                        row.suggestions.length > 0 &&
                        !agent &&
                        !awaitingAiReply &&
                        !awaitingSpecialist &&
                        !isHandingOff &&
                        !isChatClosed &&
                        intakeComplete &&
                        !activeCollectField ? (
                          <ChatQuickReplies
                            chips={buildCustomerQuickReplies(
                              lastCustomerMessageRef.current,
                              row.suggestions,
                            )}
                            onSelect={(m) => void sendCustomerMessage(m)}
                            disabled={isSending || awaitingAiReply}
                          />
                        ) : null}
                        <p className="pl-1 text-xs text-neutral-400">{formatChatTime(row.createdAt)}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex max-w-full flex-row gap-2">
                      {agent?.avatar ? (
                        <Image
                          src={AVATAR_URL + agent.avatar}
                          alt={agent?.name || 'Agent'}
                          width={24}
                          height={24}
                          className="size-8 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full">
                          <User className="size-6" strokeWidth={2.5} aria-hidden />
                        </div>
                      )}
                      <div className="mt-1 flex flex-col gap-1">
                        <p className="pl-1 text-xs font-bold text-neutral-700">{agent?.name || 'Agent'}</p>
                        <div className="rounded-xl bg-neutral-100 px-3 py-2.5 text-sm leading-snug wrap-break-word text-neutral-800">
                          {row.message}
                        </div>
                        <p className="pl-1 text-xs text-neutral-400">{formatChatTime(row.createdAt)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ),
          )}
          {activeCollectField && !intakeComplete && (
            <div className="flex min-w-0">
              <div className="max-w-[88%] min-w-0">
                <div className="flex max-w-full flex-row gap-2">
                  <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full">
                    <Bot className="size-6" strokeWidth={2.5} aria-hidden />
                  </div>
                  <div className="mt-1 flex min-w-0 flex-1 flex-col gap-2">
                    <p className="pl-1 text-xs font-bold text-neutral-700">AI Assistant</p>
                    <ChatContactCollectCard
                      cardLabel={
                        nextCollectPrompt(activeCollectField, leadRef.current.name, {
                          liability: liabilityIntake,
                        }).cardLabel
                      }
                      placeholder={
                        nextCollectPrompt(activeCollectField, leadRef.current.name, {
                          liability: liabilityIntake,
                        }).placeholder
                      }
                      field={activeCollectField}
                      register={registerIntake}
                      error={intakeErrors[activeCollectField]?.message}
                      watchValue={watchIntake(activeCollectField) ?? ''}
                      onSubmit={() => void submitCollectField(activeCollectField)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          {awaitingAiReply && !agent && (
            <div className="flex min-w-0">
              <div className="max-w-[80%] min-w-0">
                <div className="flex max-w-full flex-row gap-2">
                  <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full">
                    <Bot className="size-6" strokeWidth={2.5} aria-hidden />
                  </div>
                  <div className="mt-1 flex flex-col gap-1">
                    <p className="pl-1 text-xs font-bold text-neutral-700">AI Assistant</p>
                    <div className="rounded-xl bg-neutral-100 px-3 py-2.5">
                      <ChatTypingDots />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {(awaitingSpecialist || isHandingOff) && !agent && (
            <div className="mx-1 flex items-center gap-3 rounded-xl border border-primary/20 bg-white px-3 py-3 shadow-sm">
              <Loader2 className="text-primary size-5 shrink-0 animate-spin" aria-hidden />
              <div className="min-w-0 text-sm">
                <p className="font-medium text-neutral-900">{SPECIALIST_CONNECTING_MESSAGE}</p>
                <p className="mt-0.5 text-xs text-neutral-600">
                  {salesIntentActive
                    ? "Keep chatting — I'll keep helping while a specialist joins…"
                    : liveAgentCount > 0
                      ? `Notifying ${liveAgentCount} online specialist${liveAgentCount === 1 ? '' : 's'}…`
                      : 'Waiting for the next available specialist…'}
                </p>
              </div>
            </div>
          )}
          {showTalkToSpecialist && (
            <div className="px-1 pt-1">
              <button
                type="button"
                onClick={() => void requestSpecialistHandoff()}
                disabled={isHandingOff}
                className="border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                <MessageSquare className="size-4 shrink-0" aria-hidden />
                Chat with a real human
              </button>
            </div>
          )}
          {isChatClosed && (
            <div className="flex w-full items-center gap-3 px-2 pt-2 text-xs text-neutral-500">
              <span className="h-px flex-1 bg-neutral-300" aria-hidden />
              <span className="whitespace-nowrap">This chat session has ended</span>
              <span className="h-px flex-1 bg-neutral-300" aria-hidden />
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-neutral-200 bg-white px-4 pt-3 pb-4">
        {specialistsUnavailable && !agent && !isChatClosed && !activeCollectField && (
          <div className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs text-amber-950">
            No specialists are online right now. You can keep chatting with the AI assistant.
          </div>
        )}
        {handoffTimedOut && !agent && !isChatClosed && (
          <div className="mb-2 space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-center text-xs text-neutral-700">
            <p>No specialist joined yet. Keep chatting with AI or try again.</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => void resumeWithAi()}
                className="cursor-pointer rounded-full border border-neutral-300 bg-white px-3 py-1 font-medium text-neutral-800 hover:bg-neutral-100"
              >
                Continue with AI
              </button>
              <button
                type="button"
                onClick={() => void requestSpecialistHandoff()}
                className="bg-primary hover:bg-primary/90 cursor-pointer rounded-full px-3 py-1 font-medium text-white"
              >
                Try again
              </button>
            </div>
          </div>
        )}
        <div className="relative">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={
              isSending ||
              awaitingAiReply ||
              isChatClosed ||
              !chatSession ||
              (activeCollectField !== null && !intakeComplete)
            }
            placeholder={
              isChatClosed
                ? 'Chat session has ended'
                : !chatSession
                  ? 'Starting chat...'
                  : activeCollectField && !intakeComplete
                    ? 'Share your contact info above to continue…'
                    : awaitingSpecialist
                      ? salesIntentActive
                        ? 'Keep chatting — a specialist is joining…'
                        : 'Message will be seen when a specialist joins…'
                      : 'Type a message...'
            }
            className="focus:ring-primary/50 w-full rounded-xl border border-neutral-200 bg-neutral-50 py-3 pr-14 pl-4 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={
              !draft.trim() ||
              isSending ||
              awaitingAiReply ||
              isChatClosed ||
              !chatSession ||
              (activeCollectField !== null && !intakeComplete)
            }
            className="bg-primary hover:bg-primary/90 absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-white transition disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={isSending ? 'Sending message' : 'Send message'}
          >
            {isSending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <ArrowRight className="size-4" strokeWidth={2.5} aria-hidden />
            )}
          </button>
        </div>

        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-neutral-500">
          <Sparkles className="size-3 shrink-0" aria-hidden />
          Powered by ViewPro
        </p>
      </div>
    </div>
  );
}
