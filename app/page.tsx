'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Bot,
  CheckCircle2,
  Cpu,
  DollarSign,
  Facebook,
  Gauge,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Play,
  Quote,
  Repeat,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
  Video,
  Wind,
  Youtube,
} from 'lucide-react';
import { useViewProWidget } from '@/components/view-pro-widget-provider';
import { LiveChatDialog, type LiveChatContext } from '@/components/live-chat-dialog';
import { SeeLiveDialog } from '@/components/see-live-dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { api, type ApiRequestConfig } from '@/lib/api';
import { mapInventoryItem, type InventoryListResponse, type InventoryUnit } from '@/lib/types';
import { getInventoryPricing, formatPrice } from '@/lib/utils';

const GOLD = '#C9A45B';
const HERO_SCENE = '/images/centurion-hero-scene.png';
const EAGLE = '/images/centurion-eagle.png';
const EMPEROR_SCENE = '/images/centurion-emperor-scene.png';
const LAUREL = '/images/centurion-laurel-c.png';

const CENTURION_CHAT_CONTEXT: LiveChatContext = {
  body: 'class-c',
  unitTitle: 'Entegra Centurion (Super C)',
};

const NAV_LINKS = [
  { label: 'Home', href: '#top' },
  { label: 'Floorplans', href: '#inventory' },
  { label: 'Features', href: '#features' },
  { label: 'Technology', href: '#specs' },
  { label: 'Inventory', href: '#inventory' },
  { label: 'Gallery', href: '#inventory' },
  { label: 'Specs', href: '#specs' },
];

const SPECS = [
  { Icon: Gauge, value: 'Detroit DD13', label: '525 HP · 1,850 lb-ft torque' },
  { Icon: Truck, value: '20,000 LBS', label: 'Cargo & towing capacity' },
  { Icon: Cpu, value: 'DT12', label: '12-speed automatic — precise' },
  { Icon: Wind, value: 'Air Ride', label: 'Superior comfort, mile after mile' },
  { Icon: ShieldCheck, value: 'Advanced Safety', label: 'Adaptive cruise · lane assist · ABS' },
  { Icon: Award, value: 'Commercial Grade', label: 'Built on Freightliner Cascadia' },
];

const AI_SAMPLE_QUESTIONS = [
  "What's the towing capacity?",
  'How much cargo can it carry?',
  'What engine does it have?',
  'Show me the floorplans',
  'What units are available?',
];

const SPECIALIST_POINTS = ['Real people', 'Real answers', 'No pressure', 'Built for the Centurion'];

const WHY_POINTS = [
  'Built on the Freightliner Cascadia® chassis',
  'Detroit® DD13 525HP — Effortless power',
  '20,000 LBS cargo — Take it all',
  'Air Ride — The smoothest ride',
  'DT12™ 12-speed automatic — Precision control',
  'Advanced safety systems — Drive with confidence',
  'Luxury appointments — No compromise',
];

const TRUST_BAR = [
  { Icon: Truck, title: 'Nationwide delivery', sub: 'To your door' },
  { Icon: DollarSign, title: 'Financing available', sub: 'Competitive rates' },
  { Icon: Repeat, title: 'Trade-in welcome', sub: 'Top dollar' },
  { Icon: Users, title: 'Factory-trained team', sub: 'Here to help' },
  { Icon: Award, title: 'La Mesa RV advantage', sub: '50+ years strong' },
];

const FOOTER_QUICK = ['Floorplans', 'Features', 'Specifications', 'Inventory'];
const FOOTER_RESOURCES = ['Financing', 'Warranty', 'Trade-In', 'Delivery'];

async function fetchCenturionInventory(): Promise<InventoryUnit[]> {
  const res = (await api.get('inventory', {
    params: { make: 'entegra', model: 'centurion', perPage: 12, currentPage: 1 },
    silent: true,
  } as ApiRequestConfig)) as InventoryListResponse;
  return (res.data?.inventories ?? []).map(mapInventoryItem);
}

function GoldDivider() {
  return (
    <div className="mt-5 flex max-w-md items-center gap-3">
      <span className="h-px flex-1" style={{ background: `linear-gradient(to right, transparent, ${GOLD})` }} />
      <Image src={EAGLE} alt="" width={44} height={30} className="h-7 w-auto" />
      <span className="h-px flex-1" style={{ background: `linear-gradient(to left, transparent, ${GOLD})` }} />
    </div>
  );
}

function SectionHeading({ kicker, title }: { kicker?: string; title: string }) {
  return (
    <div className="flex flex-col gap-2">
      {kicker ? (
        <span className="text-xs font-bold tracking-[0.28em] uppercase" style={{ color: GOLD }}>
          {kicker}
        </span>
      ) : null}
      <h2 className="text-2xl font-black tracking-tight text-white uppercase sm:text-3xl md:text-4xl">
        {title}
      </h2>
    </div>
  );
}

function CenturionCoachCard({
  unit,
  onViewDetails,
}: {
  unit: InventoryUnit;
  onViewDetails: (unit: InventoryUnit) => void;
}) {
  const { currentPrice } = getInventoryPricing(unit);
  const photoSrc = unit.images?.[0] || unit.thumbnails?.[0] || unit.defaultImageUrl || '';
  const isNew = unit.wI_InventoryType?.toLowerCase() === 'new';

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition hover:border-white/30 hover:bg-white/[0.06]">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-900">
        {photoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoSrc}
            alt={unit.title}
            loading="eager"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.style.visibility = 'hidden';
            }}
            className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-b from-neutral-800 to-black">
            <Image src={LAUREL} alt="" width={56} height={56} className="h-12 w-12 opacity-80" />
            <span className="text-[10px] font-bold tracking-[0.25em] text-neutral-500 uppercase">
              Photos coming soon
            </span>
          </div>
        )}
        {isNew ? (
          <span
            className="absolute top-2 left-2 rounded px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-black uppercase"
            style={{ backgroundColor: GOLD }}
          >
            New
          </span>
        ) : null}
        {unit.wI_Year ? (
          <span className="absolute top-2 right-2 rounded bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">
            {unit.wI_Year}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <h3 className="text-sm font-extrabold tracking-wide text-white uppercase">
          Centurion {unit.wI_Configuration}
        </h3>
        <p className="text-[11px] font-medium text-neutral-400">
          {unit.stockNumber ? `#${unit.stockNumber}` : ''}
        </p>
        {unit.location ? (
          <p className="flex items-center gap-1 text-[11px] text-neutral-400">
            <MapPin className="size-3 shrink-0" style={{ color: GOLD }} aria-hidden />
            {unit.location}
          </p>
        ) : null}
        <p className="mt-1 text-lg font-black tracking-tight tabular-nums" style={{ color: GOLD }}>
          {currentPrice ? formatPrice(currentPrice) : 'Call for price'}
        </p>
        <button
          type="button"
          onClick={() => onViewDetails(unit)}
          className="mt-auto flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-3 py-2 text-[11px] font-extrabold tracking-wide text-white uppercase transition hover:bg-white/10"
        >
          View details
          <ArrowRight className="size-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
        </button>
      </div>
    </div>
  );
}

export default function CenturionHome() {
  const { isAvailable, open: openWidget } = useViewProWidget();
  const [units, setUnits] = useState<InventoryUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [seeLiveOpen, setSeeLiveOpen] = useState(false);
  const [chatContext, setChatContext] = useState<LiveChatContext>(CENTURION_CHAT_CONTEXT);

  useEffect(() => {
    let ignore = false;
    fetchCenturionInventory()
      .then((res) => !ignore && setUnits(res))
      .catch(() => !ignore && setUnits([]))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, []);

  const openAi = useCallback((context?: LiveChatContext) => {
    setChatContext(context ?? CENTURION_CHAT_CONTEXT);
    setChatOpen(true);
  }, []);

  const openUnitChat = useCallback(
    (unit: InventoryUnit) => {
      openAi({
        body: 'class-c',
        stockNumber: unit.stockNumber,
        unitTitle: `Centurion ${unit.wI_Configuration}`.trim(),
      });
    },
    [openAi],
  );

  return (
    <div id="top" className="bg-[#0a0a0a] text-neutral-100">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0a0a]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-2.5">
              <Image src={EAGLE} alt="Centurion crest" width={48} height={34} className="h-9 w-auto" />
              <div className="leading-none">
                <span className="block text-lg font-black tracking-[0.2em] text-white uppercase">Centurion</span>
                <span className="block text-[8px] font-semibold tracking-[0.3em] text-neutral-400 uppercase">
                  by Entegra Coach®
                </span>
              </div>
            </div>
            <span className="mt-1 text-[9px] font-bold tracking-[0.22em] text-neutral-400 uppercase">
              Powered by <span style={{ color: GOLD }}>La Mesa RV</span>
            </span>
          </div>

          <nav className="hidden items-center gap-5 lg:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-xs font-bold tracking-wider text-neutral-300 uppercase transition hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="flex flex-col items-stretch gap-1.5">
              {isAvailable && (
                <button
                  type="button"
                  onClick={() => setSeeLiveOpen(true)}
                  className="hidden items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-extrabold tracking-wide text-black uppercase transition hover:opacity-90 sm:flex"
                  style={{ backgroundColor: GOLD }}
                >
                  <Video className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                  See it live now
                </button>
              )}
              <button
                type="button"
                onClick={() => openAi()}
                className="flex items-center justify-center gap-1.5 rounded-md border border-white/20 px-3 py-1.5 text-[11px] font-extrabold tracking-wide text-white uppercase transition hover:bg-white/10"
              >
                <Bot className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                Talk to AI
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0">
          <Image src={HERO_SCENE} alt="Entegra Centurion in front of the Roman Colosseum" fill priority className="object-cover object-center" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]/30" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-28 lg:py-36">
          <div className="max-w-xl">
            <h1 className="text-5xl font-black tracking-tight text-white uppercase sm:text-6xl md:text-7xl">
              Built like
              <span className="block" style={{ color: GOLD }}>
                Rome.
              </span>
            </h1>
            <p className="mt-1 text-2xl font-bold tracking-wide text-neutral-100 uppercase sm:text-3xl">
              Driven by purpose.
            </p>

            <GoldDivider />

            <div className="mt-4 text-base font-bold tracking-[0.12em] uppercase">
              <p style={{ color: GOLD }}>Integra Centurion</p>
              <p className="text-neutral-200">Freightliner Cascadia®</p>
              <p className="text-neutral-200">Super C RV</p>
            </div>

            <p className="mt-5 border-l-2 pl-3 text-base font-medium text-neutral-200 italic" style={{ borderColor: GOLD }}>
              &ldquo;Live dangerously.&rdquo;
              <span className="mt-0.5 block text-xs tracking-wide text-neutral-400 uppercase not-italic">— Nietzsche</span>
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {isAvailable && (
                <button
                  type="button"
                  onClick={() => setSeeLiveOpen(true)}
                  className="flex items-center justify-center gap-2 rounded-md px-7 py-3.5 text-sm font-extrabold tracking-wide text-black uppercase shadow-lg transition hover:opacity-90"
                  style={{ backgroundColor: GOLD }}
                >
                  <Video className="size-5 shrink-0" strokeWidth={2} aria-hidden />
                  See it live now
                </button>
              )}
              <button
                type="button"
                onClick={() => openAi()}
                className="flex items-center justify-center gap-2 rounded-md border border-white/30 bg-black/30 px-7 py-3.5 text-sm font-extrabold tracking-wide text-white uppercase backdrop-blur transition hover:bg-white/10"
              >
                <Bot className="size-5 shrink-0" strokeWidth={2} aria-hidden />
                Talk to AI
              </button>
            </div>

            <p className="mt-5 text-xs font-bold tracking-[0.2em] text-neutral-300 uppercase">
              Real answers. Real time. Real people.
            </p>
          </div>

          <div
            className="absolute right-4 bottom-4 hidden items-center gap-3 rounded-xl border px-4 py-3 backdrop-blur md:flex"
            style={{ borderColor: `${GOLD}66`, backgroundColor: 'rgba(10,10,10,0.65)' }}
          >
            <BadgeCheck className="size-8 shrink-0" style={{ color: GOLD }} strokeWidth={1.75} aria-hidden />
            <div>
              <p className="text-base font-black text-white">2 + 3 Year Warranty</p>
              <p className="text-[11px] text-neutral-300">No one offers a better warranty</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Spec strip ─────────────────────────────────────── */}
      <section id="specs" className="border-b border-white/10 bg-white/[0.02]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 px-4 py-8 sm:px-6 md:grid-cols-3 lg:grid-cols-6">
          {SPECS.map(({ Icon, value, label }, i) => (
            <div
              key={value}
              className={`flex flex-col items-center gap-2 px-3 py-4 text-center ${i !== 0 ? 'lg:border-l lg:border-white/10' : ''}`}
            >
              <Icon className="size-7 shrink-0" style={{ color: GOLD }} strokeWidth={1.75} aria-hidden />
              <p className="text-sm font-black tracking-wide text-white uppercase">{value}</p>
              <p className="text-[11px] leading-snug text-neutral-400">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature cards: AI / Live / Specialist ──────────── */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Talk to AI */}
          <div className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center gap-2">
              <Bot className="size-6 shrink-0" style={{ color: GOLD }} aria-hidden />
              <h3 className="text-lg font-black tracking-wide text-white uppercase">Talk to our AI</h3>
            </div>
            <p className="mt-2 text-sm text-neutral-400">
              Get instant answers about the Centurion from our AI specialist.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {AI_SAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => openAi()}
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-xs text-neutral-300 transition hover:border-white/25 hover:text-white"
                >
                  {q}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => openAi()}
              className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-extrabold tracking-wide text-black uppercase transition hover:opacity-90"
              style={{ backgroundColor: GOLD }}
            >
              Ask AI now
              <ArrowRight className="size-4 shrink-0" strokeWidth={2.5} aria-hidden />
            </button>
            <p className="mt-2 text-center text-[10px] tracking-wide text-neutral-500 uppercase">
              AI knows. People close.
            </p>
          </div>

          {/* See it Live — only when a specialist is online (agent app) */}
          {isAvailable && (
          <div className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center gap-2">
              <Video className="size-6 shrink-0" style={{ color: GOLD }} aria-hidden />
              <h3 className="text-lg font-black tracking-wide text-white uppercase">See it live</h3>
            </div>
            <p className="mt-2 text-sm text-neutral-400">Real-time video tour with a product specialist.</p>
            <button
              type="button"
              onClick={() => setSeeLiveOpen(true)}
              className="group relative mt-4 flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-neutral-900"
            >
              <Image src={HERO_SCENE} alt="" fill className="object-cover opacity-70 transition group-hover:opacity-90" sizes="400px" />
              <span className="relative flex size-14 items-center justify-center rounded-full bg-black/60 ring-2 ring-white/40 transition group-hover:scale-110">
                <Play className="size-6 translate-x-0.5 text-white" fill="currentColor" aria-hidden />
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSeeLiveOpen(true)}
              className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-extrabold tracking-wide text-black uppercase transition hover:opacity-90"
              style={{ backgroundColor: GOLD }}
            >
              <Video className="size-4 shrink-0" strokeWidth={2.5} aria-hidden />
              See it live now
            </button>
            <p className="mt-2 text-center text-[10px] tracking-wide text-neutral-500 uppercase">Powered by WebRTC</p>
          </div>
          )}

          {/* Talk to a Specialist */}
          <div className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center gap-2">
              <Users className="size-6 shrink-0" style={{ color: GOLD }} aria-hidden />
              <h3 className="text-lg font-black tracking-wide text-white uppercase">Talk to a specialist</h3>
            </div>
            <p className="mt-2 text-sm text-neutral-400">Connect instantly with a real Centurion expert.</p>
            <ul className="mt-4 flex flex-col gap-3">
              {SPECIALIST_POINTS.map((point) => (
                <li key={point} className="flex items-center gap-2 text-sm text-neutral-200">
                  <CheckCircle2 className="size-5 shrink-0" style={{ color: GOLD }} aria-hidden />
                  {point}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={openWidget}
              className="mt-auto flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-white/20 px-4 py-3 text-sm font-extrabold tracking-wide text-white uppercase transition hover:bg-white/10"
            >
              <Phone className="size-4 shrink-0" strokeWidth={2.5} aria-hidden />
              Connect now
            </button>
            <p className="mt-2 text-center text-[10px] tracking-wide text-neutral-500 uppercase">
              We know the Centurion, inside &amp; out.
            </p>
          </div>
        </div>
      </section>

      {/* ── Inventory carousel ─────────────────────────────── */}
      <section id="inventory" className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              kicker="Available now"
              title={loading ? 'Centurion coaches available' : `${units.length} Centurion coaches available`}
            />
            <button
              type="button"
              onClick={() => openAi()}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-white/20 px-4 py-2 text-xs font-extrabold tracking-wide text-white uppercase transition hover:bg-white/10"
            >
              View all inventory
              <ArrowRight className="size-4 shrink-0" strokeWidth={2.5} aria-hidden />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-72 animate-pulse rounded-xl border border-white/10 bg-white/[0.04]" />
              ))}
            </div>
          ) : units.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-10 text-center">
              <p className="text-neutral-300">No Centurion coaches are loaded yet.</p>
              <button
                type="button"
                onClick={() => openAi()}
                className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-md px-5 py-2.5 text-sm font-extrabold tracking-wide text-black uppercase"
                style={{ backgroundColor: GOLD }}
              >
                Ask our AI what&apos;s coming
              </button>
            </div>
          ) : (
            <div className="relative">
              <Carousel opts={{ align: 'start' }} className="w-full">
                <CarouselContent>
                  {units.map((unit) => (
                    <CarouselItem
                      key={unit.id}
                      className="basis-[80%] pl-4 sm:basis-[45%] lg:basis-1/4 xl:basis-1/5"
                    >
                      <CenturionCoachCard unit={unit} onViewDetails={openUnitChat} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="-left-3 size-10 border-white/20 bg-[#141414] text-white hover:bg-[#1f1f1f] hover:text-white" />
                <CarouselNext className="-right-3 size-10 border-white/20 bg-[#141414] text-white hover:bg-[#1f1f1f] hover:text-white" />
              </Carousel>
            </div>
          )}
        </div>
      </section>

      {/* ── Trust bar ──────────────────────────────────────── */}
      <section className="border-b border-white/10">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-6 px-4 py-8 sm:px-6 md:grid-cols-5 md:gap-0">
          {TRUST_BAR.map(({ Icon, title, sub }, i) => (
            <div
              key={title}
              className={`flex items-center gap-3 px-2 md:justify-center ${i !== 0 ? 'md:border-l md:border-white/10' : ''}`}
            >
              <Icon className="size-7 shrink-0" style={{ color: GOLD }} strokeWidth={1.75} aria-hidden />
              <div>
                <p className="text-xs font-extrabold tracking-wide text-white uppercase">{title}</p>
                <p className="text-[11px] text-neutral-400">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why Centurion ──────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="text-xs font-bold tracking-[0.28em] uppercase" style={{ color: GOLD }}>
              Why Centurion?
            </span>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white uppercase sm:text-3xl md:text-4xl">
              The ultimate Super C experience
            </h2>
            <ul className="mt-6 flex flex-col gap-3">
              {WHY_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm text-neutral-200 sm:text-base">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0" style={{ color: GOLD }} aria-hidden />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative min-h-[380px] overflow-hidden rounded-2xl border border-white/10 bg-black">
            <Image src={EMPEROR_SCENE} alt="Roman emperor statue at sunset" fill className="object-cover object-right" sizes="(min-width: 1024px) 50vw, 100vw" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
            <div className="relative z-10 flex h-full max-w-md flex-col justify-center gap-3 p-8 sm:p-10">
              <Quote className="size-10 -scale-x-100" style={{ color: GOLD }} aria-hidden />
              <p className="text-2xl leading-snug font-bold text-white sm:text-1xl">
                Become who you are. <br></br>Do what you must. <br></br>Build your empire on wheels.
              </p>
              <p className="text-sm tracking-[0.2em] uppercase" style={{ color: GOLD }}>
                — Nietzsche
              </p>
              <Image src={LAUREL} alt="" width={72} height={72} className="mt-2 h-16 w-16" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Closing CTA ────────────────────────────────────── */}
      <section
        className="border-y border-white/10"
        style={{ background: `linear-gradient(90deg, #0a0a0a 0%, #1a1407 50%, #0a0a0a 100%)` }}
      >
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-12 text-center sm:px-6 md:flex-row md:text-left">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white uppercase sm:text-3xl md:text-4xl">
              The road is calling.
              <span className="md:ml-2 md:inline" style={{ color: GOLD }}>
                The Centurion is ready.
              </span>
            </h2>
            <p className="mt-2 text-sm text-neutral-300">
              Limited inventory. Limitless destinations. Don&apos;t just dream it. Drive it.
            </p>
          </div>
          {isAvailable && (
            <button
              type="button"
              onClick={() => setSeeLiveOpen(true)}
              className="flex shrink-0 items-center justify-center gap-2 rounded-md px-7 py-4 text-sm font-extrabold tracking-wide text-black uppercase shadow-lg transition hover:opacity-90"
              style={{ backgroundColor: GOLD }}
            >
              <Video className="size-5 shrink-0" strokeWidth={2} aria-hidden />
              See it live now
            </button>
          )}
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="bg-[#0a0a0a]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-12 sm:px-6 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <Image src={EAGLE} alt="" width={40} height={28} className="h-8 w-auto" />
              <div className="leading-none">
                <p className="text-base font-black tracking-[0.18em] text-white uppercase">La Mesa RV</p>
                <p className="mt-0.5 text-[10px] tracking-[0.2em] text-neutral-500 uppercase">Experience life</p>
              </div>
            </div>
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-neutral-400">
              Home of the Entegra Centurion Super C. Real answers, real time, real people.
            </p>
          </div>

          <div>
            <p className="text-xs font-extrabold tracking-wide uppercase" style={{ color: GOLD }}>
              Contact
            </p>
            <ul className="mt-4 flex flex-col gap-2 text-xs text-neutral-400">
              <li className="flex items-center gap-2">
                <Phone className="size-3.5 shrink-0" aria-hidden /> (239) 999-0928
              </li>
              <li className="flex items-center gap-2">
                <Mail className="size-3.5 shrink-0" aria-hidden /> info@lamesarv.com
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="size-3.5 shrink-0" aria-hidden /> Fort Myers, FL
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-extrabold tracking-wide uppercase" style={{ color: GOLD }}>
              Quick links
            </p>
            <ul className="mt-4 flex flex-col gap-2 text-xs text-neutral-400">
              {FOOTER_QUICK.map((item) => (
                <li key={item}>
                  <a href="#inventory" className="transition hover:text-white">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-extrabold tracking-wide uppercase" style={{ color: GOLD }}>
              Resources
            </p>
            <ul className="mt-4 flex flex-col gap-2 text-xs text-neutral-400">
              {FOOTER_RESOURCES.map((item) => (
                <li key={item}>
                  <a href="#features" className="transition hover:text-white">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-extrabold tracking-wide uppercase" style={{ color: GOLD }}>
              Connect
            </p>
            <div className="mt-4 flex gap-3">
              {[Facebook, Instagram, Youtube, MessageCircle].map((Icon, i) => (
                <span
                  key={i}
                  className="flex size-9 items-center justify-center rounded-full border border-white/15 text-neutral-300 transition hover:border-white/40 hover:text-white"
                >
                  <Icon className="size-4" aria-hidden />
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 py-4">
          <p className="text-center text-[11px] text-neutral-500">
            © {new Date().getFullYear()} La Mesa RV. All rights reserved. · Centurion by Entegra Coach
          </p>
        </div>
      </footer>

      {/* ── Floating AI button ─────────────────────────────── */}
      <button
        type="button"
        aria-label="Talk to the Centurion AI"
        onClick={() => openAi()}
        className="fixed right-4 bottom-6 z-50 flex cursor-pointer items-center gap-2 rounded-full px-4 py-3 text-sm font-extrabold tracking-wide text-black uppercase shadow-lg transition hover:opacity-90 sm:right-6"
        style={{ backgroundColor: GOLD }}
      >
        <Sparkles className="size-5 shrink-0" strokeWidth={2} aria-hidden />
        Ask AI
      </button>

      <LiveChatDialog open={chatOpen} onOpenChange={setChatOpen} chatContext={chatContext} />
      <SeeLiveDialog open={seeLiveOpen} onOpenChange={setSeeLiveOpen} featuredUnits={units} />
    </div>
  );
}
