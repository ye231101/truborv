'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useForm, type UseFormRegister } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowUp, ChevronRight, Lock, Tag } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useViewProWidget } from '@/components/view-pro-widget-provider';
import { api } from '@/lib/api';
import { enrichCustomerAiReply } from '@/lib/chat-intelligence';
import { cn, formatChatTime, formatPrice, getInventoryPricing, unitThumbnailSrc } from '@/lib/utils';
import { AVATAR_URL } from '@/lib/constants';
import { mapInventoryItem, type InventoryUnit, type ChatGPTResponse } from '@/lib/types';

type CollectField = 'name' | 'email' | 'phone';

type ChatMessage =
  | {
      id: string;
      role: 'bot' | 'agent' | 'user';
      kind: 'text';
      text: string;
      time: number;
      inventories?: InventoryUnit[];
    }
  | {
      id: string;
      role: 'bot';
      kind: 'collect';
      field: CollectField;
      prompt: string;
      cardLabel: string;
      placeholder: string;
      time: number;
      completed: boolean;
    };

type TextUsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit?: InventoryUnit;
};

const COLLECT_ORDER: CollectField[] = ['name', 'email', 'phone'];

const intakeSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your full name.').max(120),
  email: z.string().trim().email('Please enter a valid email address.').max(254),
  phone: z
    .string()
    .trim()
    .min(1, 'Please enter a valid phone number.')
    .refine((v) => v.replace(/\D/g, '').length >= 10, 'Please enter a valid phone number.'),
});

type IntakeForm = z.infer<typeof intakeSchema>;

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

function buildInitialMessages(unit: InventoryUnit | undefined): ChatMessage[] {
  return [
    {
      id: 'welcome',
      role: 'bot',
      kind: 'text',
      text: `Hi! Thanks for your interest ${unit ? `in the ${unit.title}` : 'in our inventory'}.`,
      time: Date.now(),
    },
    {
      id: crypto.randomUUID(),
      role: 'bot',
      kind: 'collect',
      field: 'name',
      prompt: 'Give the team a way to reach you.',
      cardLabel: "What's your name?",
      placeholder: 'Please enter your name',
      time: Date.now(),
      completed: false,
    },
  ];
}

function nextCollectPrompt(
  field: CollectField,
  name: string,
): Omit<Extract<ChatMessage, { kind: 'collect' }>, 'id' | 'time' | 'completed'> {
  switch (field) {
    case 'email':
      return {
        role: 'bot',
        kind: 'collect',
        field: 'email',
        prompt: `Nice to meet you, ${name.split(' ')[0]}!`,
        cardLabel: 'Get notified by email',
        placeholder: 'Please enter your email',
      };
    case 'phone':
      return {
        role: 'bot',
        kind: 'collect',
        field: 'phone',
        prompt: "We'll send updates to that address.",
        cardLabel: 'Best number to reach you',
        placeholder: 'Please enter your phone number',
      };
    default:
      return {
        role: 'bot',
        kind: 'collect',
        field: 'name',
        prompt: 'Give the team a way to reach you.',
        cardLabel: "What's your name?",
        placeholder: 'Please enter your name',
      };
  }
}

function InlineCollectCard({
  cardLabel,
  placeholder,
  field,
  register,
  error,
  watchValue,
  onSubmit,
  disabled,
}: {
  cardLabel: string;
  placeholder: string;
  field: CollectField;
  register: UseFormRegister<IntakeForm>;
  error?: string;
  watchValue: string;
  onSubmit: () => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputType = field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text';
  const autoComplete = field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'name';
  const { ref, ...fieldProps } = register(field);

  useEffect(() => {
    if (!disabled) {
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [disabled, cardLabel]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="rounded-2xl rounded-tl-md border border-neutral-200/80 bg-white px-3 py-3 shadow-sm"
    >
      <p className="text-sm font-semibold text-neutral-900">{cardLabel}</p>
      <div className="relative mt-2">
        <input
          ref={(el) => {
            ref(el);
            inputRef.current = el;
          }}
          type={inputType}
          autoComplete={autoComplete}
          disabled={disabled}
          placeholder={placeholder}
          aria-invalid={!!error}
          className={cn(
            'w-full rounded-xl border border-neutral-200 bg-neutral-50/50 py-2.5 pr-12 pl-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-300 focus:bg-white focus:ring-2 focus:ring-neutral-200/80 disabled:cursor-not-allowed disabled:opacity-60',
            error && 'border-red-300 focus:ring-red-100',
          )}
          {...fieldProps}
        />
        <button
          type="submit"
          disabled={disabled || !watchValue.trim()}
          className="bg-primary hover:bg-primary/90 absolute top-1/2 right-1 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-white transition disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Submit"
        >
          <ChevronRight className="size-4" strokeWidth={2.5} aria-hidden />
        </button>
      </div>
      {error ? <p className="mt-1.5 text-xs text-red-600">{error}</p> : null}
    </form>
  );
}

export function TextUsDialog({ open, onOpenChange, unit }: TextUsDialogProps) {
  const { isAvailable, agents } = useViewProWidget();

  const [intakeComplete, setIntakeComplete] = useState(false);
  const leadRef = useRef({ name: '', email: '', phone: '' });

  const [draft, setDraft] = useState('');
  const [awaitingChatReply, setAwaitingChatReply] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => buildInitialMessages(unit));
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    register,
    watch,
    trigger,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm<IntakeForm>({
    resolver: zodResolver(intakeSchema),
    defaultValues: { name: '', email: '', phone: '' },
    mode: 'onSubmit',
  });

  const { msrp, currentPrice, savingAmount } = unit
    ? getInventoryPricing(unit)
    : { msrp: 0, currentPrice: 0, savingAmount: 0 };

  const metaLine = [
    unit?.stockNumber ? `Stock #${unit.stockNumber}` : null,
    unit?.wI_Length ? `${unit.wI_Length}ft` : null,
    unit?.wI_Fuel || null,
  ]
    .filter(Boolean)
    .join(' • ');

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    if (!open) return;
    setMessages(buildInitialMessages(unit));
    setAwaitingChatReply(false);
    setIntakeComplete(false);
    leadRef.current = { name: '', email: '', phone: '' };
    reset({ name: '', email: '', phone: '' });
    setDraft('');
  }, [open, unit, reset]);

  useEffect(() => {
    if (!open) return;
    scrollToBottom();
  }, [messages, awaitingChatReply, open, scrollToBottom]);

  const collectField = useCallback((field: CollectField, value: string) => {
    const text = value.trim();
    leadRef.current[field] = text;

    const fieldIndex = COLLECT_ORDER.indexOf(field);
    const nextField = COLLECT_ORDER[fieldIndex + 1];

    setMessages((prev) => {
      const updated = prev.map((msg) =>
        msg.kind === 'collect' && msg.field === field && !msg.completed ? { ...msg, completed: true } : msg,
      );

      const next: ChatMessage[] = [
        ...updated,
        {
          id: crypto.randomUUID(),
          role: 'user',
          kind: 'text',
          text: text,
          time: Date.now(),
        },
      ];

      if (nextField) {
        const prompt = nextCollectPrompt(nextField, leadRef.current.name);
        next.push({
          id: crypto.randomUUID(),
          ...prompt,
          time: Date.now(),
          completed: false,
        });
      } else {
        next.push({
          id: crypto.randomUUID(),
          role: 'bot',
          kind: 'text',
          text: "You're all set! What can we help you with today?",
          time: Date.now(),
        });
      }

      return next;
    });

    if (!nextField) setIntakeComplete(true);
  }, []);

  const submitCollectField = useCallback(
    async (field: CollectField, value: string) => {
      setValue(field, value, { shouldValidate: false });
      const valid = await trigger(field);
      if (!valid) return false;
      collectField(field, getValues(field));
      setValue(field, '');
      return true;
    },
    [collectField, getValues, setValue, trigger],
  );

  const appendUserMessage = useCallback(async (message: string) => {
    const text = message.trim();
    if (!text) return;

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: 'user',
        kind: 'text',
        text,
        time: Date.now(),
      },
    ]);
    setDraft('');
    setAwaitingChatReply(true);

    try {
      const { reply, inventories } = await fetchChatResponse(text);

      if (reply || inventories.length > 0) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'bot',
            kind: 'text',
            text: reply || 'Here are some matching units.',
            time: Date.now(),
            ...(inventories.length > 0 ? { inventories } : {}),
          },
        ]);
      }
    } catch {
      // Errors surface via api interceptors (toast)
    } finally {
      setAwaitingChatReply(false);
    }
  }, []);

  const fetchChatResponse = useCallback(async (message: string) => {
    const res = (await api.post('chatgpt/chat', { message }, { timeout: 90_000 })) as ChatGPTResponse;
    const { reply, inventories = [] } = res.data;
    return {
      reply: enrichCustomerAiReply(message, reply?.trim() ?? ''),
      inventories: inventories.map(mapInventoryItem),
    };
  }, []);

  const handleSend = () => appendUserMessage(draft);

  const handleIncentiveCta = () => {
    if (!intakeComplete) return;
    appendUserMessage("I'd like your best price and any available incentives.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        aria-describedby={undefined}
        className="flex h-full w-full max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 p-0 shadow-xl sm:h-[90vh] sm:max-h-[90vh] sm:max-w-xl sm:rounded-xl sm:border sm:border-neutral-200"
      >
        <DialogTitle className="flex items-center justify-center border-b border-neutral-200 bg-white p-4">
          <span className="text-base font-bold text-neutral-900">Text Us</span>
        </DialogTitle>
        <DialogDescription className="sr-only">Chat with a specialist</DialogDescription>

        {unit && (
          <div className="shrink-0 border-b border-neutral-200 bg-white p-4">
            <div className="flex gap-3">
              <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-neutral-100">
                <Image
                  src={unitThumbnailSrc(unit)}
                  alt={unit.title}
                  fill
                  className="size-full object-cover"
                  sizes="96px"
                  unoptimized
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-foreground text-sm font-semibold">{unit.title}</p>
                {metaLine ? <p className="mt-0.5 text-xs text-neutral-500">{metaLine}</p> : null}
                <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0">
                  {!currentPrice ? (
                    <span className="text-sm font-bold text-neutral-900">Call for price</span>
                  ) : (
                    <>
                      <span className="text-sm font-bold text-neutral-900 tabular-nums">
                        {formatPrice(currentPrice)}
                      </span>
                      {msrp > currentPrice ? (
                        <span className="text-xs text-neutral-400 tabular-nums line-through">{formatPrice(msrp)}</span>
                      ) : null}
                    </>
                  )}
                </div>
                {savingAmount > 0 ? (
                  <p className="mt-0.5 text-xs font-semibold text-emerald-600 tabular-nums">
                    Save {formatPrice(savingAmount)}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {isAvailable && (
          <div className="shrink-0 border-b border-neutral-200 px-4 py-3">
            <div className="rounded-lg border border-neutral-200 bg-white p-3">
              <div className="flex items-center gap-3">
                {agents.length > 0 && (
                  <div className="flex shrink-0 -space-x-2">
                    {agents.slice(0, 3).map((agent) => (
                      <Image
                        key={agent.username}
                        src={`${AVATAR_URL}${agent.avatar}`}
                        alt=""
                        width={36}
                        height={36}
                        className="size-9 rounded-full border-2 border-white object-cover"
                      />
                    ))}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-bold text-neutral-900">
                    {agents.length} {agents.length === 1 ? 'Specialist' : 'Specialists'} Online
                  </p>
                  <p className="text-xs text-neutral-600">
                    We typically reply in <span className="font-semibold text-emerald-600">42 sec</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleIncentiveCta}
                disabled={!intakeComplete || awaitingChatReply}
                className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#F5F0E6] px-3 py-2.5 text-sm font-semibold text-neutral-800 transition hover:bg-[#EDE6D6] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Tag className="size-4 shrink-0 text-neutral-700" strokeWidth={2} aria-hidden />
                Get our best price + available incentives
              </button>
            </div>
          </div>
        )}

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto bg-neutral-50/80 px-4 py-4">
          <div className="space-y-2">
            {messages.map((message) => {
              if (message.kind === 'collect') {
                const fieldError = errors[message.field]?.message;
                const fieldValue = watch(message.field) ?? '';

                return (
                  <div key={message.id} className="flex gap-2">
                    <Image
                      src="/images/robot.png"
                      alt=""
                      width={28}
                      height={28}
                      className="mt-1 size-8 shrink-0 rounded-full object-cover"
                    />
                    <div className="max-w-[80%] space-y-2">
                      <div className="rounded-2xl rounded-tl-md border border-neutral-200/80 bg-white px-3 py-2 text-sm leading-snug text-neutral-800 shadow-sm">
                        {message.prompt}
                      </div>
                      {!message.completed ? (
                        <InlineCollectCard
                          cardLabel={message.cardLabel}
                          placeholder={message.placeholder}
                          field={message.field}
                          register={register}
                          error={fieldError}
                          watchValue={fieldValue}
                          disabled={message.completed}
                          onSubmit={() => void submitCollectField(message.field, getValues(message.field))}
                        />
                      ) : null}
                      <p className="pl-1 text-[11px] text-neutral-400">{formatChatTime(new Date(message.time))}</p>
                    </div>
                  </div>
                );
              }

              if (message.kind === 'text' && message.role === 'bot') {
                const units = message.inventories;
                return (
                  <div key={message.id} className="flex gap-2">
                    <Image
                      src="/images/robot.png"
                      alt=""
                      width={28}
                      height={28}
                      className="mt-1 size-8 shrink-0 rounded-full object-cover"
                    />
                    <div className="max-w-[80%] min-w-0 space-y-2">
                      <div className="w-fit max-w-full rounded-2xl rounded-tl-md border border-neutral-200/80 bg-white px-3 py-2 text-sm leading-snug text-neutral-800 shadow-sm">
                        {message.text}
                      </div>
                      {units && units.length > 0 ? (
                        <div className="relative mt-2 w-full min-w-0">
                          <Carousel opts={{ align: 'start', dragFree: false }} className="relative w-full min-w-0">
                            <CarouselContent className="-ml-2">
                              {units.map((u) => {
                                const specLine = [
                                  u.stockNumber ? `Stock #${u.stockNumber}` : null,
                                  u.wI_Length ? `${u.wI_Length}ft` : null,
                                  u.wI_Fuel || null,
                                ]
                                  .filter(Boolean)
                                  .join(' • ');
                                const { msrp, currentPrice, savingAmount } = getInventoryPricing(u);
                                return (
                                  <CarouselItem key={u.id} className="min-w-0 basis-[82%] pl-2 sm:basis-[70%]">
                                    <Link
                                      href={`/inventory/${u.id}`}
                                      className="block w-full overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-sm transition hover:border-neutral-300 hover:shadow-md"
                                    >
                                      <div className="relative aspect-4/3 bg-neutral-100">
                                        <Image
                                          src={unitThumbnailSrc(u)}
                                          alt=""
                                          fill
                                          className="object-cover"
                                          sizes="200px"
                                          unoptimized
                                        />
                                      </div>
                                      <div className="p-2">
                                        <p className="line-clamp-2 text-xs font-semibold text-neutral-900">{u.title}</p>
                                        {specLine ? <p className="mt-1 text-xs text-neutral-500">{specLine}</p> : null}
                                        {!currentPrice ? (
                                          <p className="mt-1 text-xs font-semibold text-neutral-800">Call for price</p>
                                        ) : (
                                          <div className="mt-1 space-y-0.5">
                                            <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
                                              <span className="text-sm font-bold tracking-tight text-neutral-900 tabular-nums">
                                                {formatPrice(currentPrice)}
                                              </span>
                                              {msrp > currentPrice ? (
                                                <span className="text-xs text-neutral-400 tabular-nums line-through">
                                                  {formatPrice(msrp)}
                                                </span>
                                              ) : null}
                                            </div>
                                            {savingAmount > 0 ? (
                                              <p className="text-xs font-semibold text-emerald-600 tabular-nums">
                                                Save {formatPrice(savingAmount)}
                                              </p>
                                            ) : null}
                                          </div>
                                        )}
                                      </div>
                                    </Link>
                                  </CarouselItem>
                                );
                              })}
                            </CarouselContent>
                            {units.length > 1 ? (
                              <>
                                <CarouselPrevious
                                  variant="outline"
                                  className="top-1/2 left-0 z-10 size-8 -translate-y-1/2 border-neutral-200 bg-white/95 shadow-sm"
                                />
                                <CarouselNext
                                  variant="outline"
                                  className="top-1/2 right-0 z-10 size-8 -translate-y-1/2 border-neutral-200 bg-white/95 shadow-sm"
                                />
                              </>
                            ) : null}
                          </Carousel>
                        </div>
                      ) : null}
                      <p className="mt-1 pl-1 text-[11px] text-neutral-400">{formatChatTime(new Date(message.time))}</p>
                    </div>
                  </div>
                );
              }

              return (
                <div key={message.id} className="flex flex-col items-end">
                  <div className="max-w-[80%]">
                    <div className="bg-primary rounded-2xl rounded-tr-md px-3 py-2 text-sm leading-snug text-white shadow-sm">
                      {message.text}
                    </div>
                    <div className="mt-1 flex items-center justify-end gap-1 pr-1 text-[11px] text-neutral-400">
                      {formatChatTime(new Date(message.time))}
                    </div>
                  </div>
                </div>
              );
            })}
            {awaitingChatReply ? (
              <div className="flex gap-2" role="status" aria-live="polite" aria-label="Assistant is typing">
                <Image
                  src="/images/robot.png"
                  alt=""
                  width={28}
                  height={28}
                  className="mt-1 size-8 shrink-0 rounded-full object-cover"
                />
                <div className="max-w-[80%] rounded-2xl rounded-tl-md border border-neutral-200/80 bg-white px-4 py-3 shadow-sm">
                  <ChatTypingDots />
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 border-t border-neutral-200 bg-white px-4 pt-3 pb-4">
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
              placeholder="Type your message..."
              disabled={awaitingChatReply}
              className="focus:ring-primary/50 w-full rounded-full border border-neutral-300 bg-white py-3 pr-14 pl-4 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!draft.trim() || awaitingChatReply}
              className="bg-primary hover:bg-primary/90 absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-white transition disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send message"
            >
              <ArrowUp className="size-4" strokeWidth={2.5} aria-hidden />
            </button>
          </div>

          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-neutral-500">
            <Lock className="size-3 shrink-0" aria-hidden />
            Your information is secure and never shared.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
