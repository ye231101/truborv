'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Award,
  BadgeCheck,
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
  Repeat,
  ShieldCheck,
  Truck,
  Users,
  Video,
  Wind,
  Youtube,
} from 'lucide-react';
import { useViewProWidget } from '@/components/view-pro-widget-provider';
import { LiveChatDialog, type LiveChatContext } from '@/components/live-chat-dialog';
import { SeeLiveDialog } from '@/components/see-live-dialog';
import { ContactDialog } from '@/components/contact-dialog';
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
  { label: 'Floorplans', href: '#floorplans' },
  { label: 'Specs', href: '#specs' },
  { label: 'Inventory', href: '#inventory' },
  { label: 'Contact', href: '#contact' },
];

const SPECS = [
  { Icon: Gauge, value: 'Detroit DD13 / DD16', label: '525–600 HP · 1,850 lb-ft torque' },
  { Icon: Cpu, value: 'DT12™ 12-Speed', label: 'Automated manual overdrive' },
  { Icon: Truck, value: 'Cascadia 116 / 126', label: 'Freightliner® commercial chassis' },
  { Icon: Wind, value: 'E-Z Drive Premier', label: 'Hydraulic Smart Level system' },
  { Icon: ShieldCheck, value: 'All-Wheel Air Disc', label: '18k / 23k axles · TPMS' },
  { Icon: Award, value: '120 gal Fuel', label: '20,000 lb hitch · 7-pin' },
];

const WHY_POINTS = [
  'Freightliner® Cascadia 116 & 126 chassis',
  'Detroit® DD13 525 HP — or DD16 power on the 45D',
  'DT12™ 12-speed automated manual overdrive',
  'All-wheel air disc brakes · 18k front / 23k rear axles',
  'Equalizer™ hydraulic Smart Level system',
  'Sikkens® full-body paint — eight colors',
  'Residential interiors — sleeps up to 5',
];

const FLOORPLANS = [
  {
    name: '39N',
    length: "42'",
    chassis: 'Freightliner® Cascadia 116 Day Cab',
    engine: 'Detroit® DD13 · 525 HP',
    blurb: 'Twin-bed flagship layout with residential galley and a full rear bath.',
  },
  {
    name: '39K',
    length: "42'",
    chassis: 'Freightliner® Cascadia 116 Day Cab',
    engine: 'Detroit® DD13 · 525 HP',
    blurb: 'Kitchen-island floorplan built for everyday living on the road.',
  },
  {
    name: '45D',
    length: '45\u2032 10\u2033',
    chassis: 'Freightliner® Cascadia 126',
    engine: 'Detroit® DD16 · up to 600 HP',
    blurb: 'The largest, most powerful Centurion — maximum space and torque.',
  },
];

const PAINT_COLORS = [
  { name: 'Celtic Gold', hex: '#b8932f' },
  { name: 'Midnight Envy', hex: '#16243a' },
  { name: 'Onyx Black', hex: '#0c0c0d' },
  { name: 'Silver Fox', hex: '#9aa0a6' },
  { name: 'True Blue', hex: '#1f4e8c' },
  { name: 'Velocity Blue', hex: '#2b6fb3' },
  { name: 'Crystal White', hex: '#eceef0' },
  { name: 'Gray Storm', hex: '#5b6066' },
];

const TRUST_BAR = [
  { Icon: ShieldCheck, title: '2 + 3 Year Warranty', sub: 'Industry best' },
  { Icon: DollarSign, title: 'Financing available', sub: 'Competitive rates' },
  { Icon: Repeat, title: 'Trade-in welcome', sub: 'Top dollar' },
  { Icon: Users, title: 'Factory-trained team', sub: 'Here to help' },
  { Icon: Award, title: 'La Mesa RV advantage', sub: '50+ years strong' },
];

const FOOTER_QUICK = ['Floorplans', 'Specifications', 'Inventory', 'Contact'];
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
      <h2 className="text-2xl font-black tracking-tight text-neutral-900 uppercase sm:text-3xl md:text-4xl">
        {title}
      </h2>
    </div>
  );
}

function CenturionCoachCard({ unit }: { unit: InventoryUnit }) {
  const { currentPrice } = getInventoryPricing(unit);
  const photoSrc = unit.images?.[0] || unit.thumbnails?.[0] || unit.defaultImageUrl || '';
  const isNew = unit.wI_InventoryType?.toLowerCase() === 'new';

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition hover:border-[#C9A45B] hover:shadow-md">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
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
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-neutral-100">
            <Image src={LAUREL} alt="" width={56} height={56} className="h-12 w-12 opacity-50" />
            <span className="text-[10px] font-bold tracking-[0.25em] text-neutral-400 uppercase">
              Photos coming soon
            </span>
          </div>
        )}
        {isNew ? (
          <span
            className="absolute top-2 left-2 rounded px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-neutral-900 uppercase"
            style={{ backgroundColor: GOLD }}
          >
            New
          </span>
        ) : null}
        {unit.wI_Year ? (
          <span className="absolute top-2 right-2 rounded bg-white/90 px-2 py-0.5 text-[10px] font-bold text-neutral-900 shadow-sm">
            {unit.wI_Year}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <h3 className="text-sm font-extrabold tracking-wide text-neutral-900 uppercase">
          Centurion {unit.wI_Configuration}
        </h3>
        <p className="text-[11px] font-medium text-neutral-500">
          {unit.stockNumber ? `#${unit.stockNumber}` : ''}
        </p>
        {unit.location ? (
          <p className="flex items-center gap-1 text-[11px] text-neutral-500">
            <MapPin className="size-3 shrink-0" style={{ color: GOLD }} aria-hidden />
            {unit.location}
          </p>
        ) : null}
        <p className="mt-1 text-lg font-black tracking-tight tabular-nums text-neutral-900">
          {currentPrice ? formatPrice(currentPrice) : 'Request price'}
        </p>
        <Link
          href={`/inventory/${unit.id}`}
          className="mt-auto flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 py-2 text-[11px] font-extrabold tracking-wide text-neutral-900 uppercase transition hover:border-neutral-400 hover:bg-neutral-50"
        >
          View details
          <ArrowRight className="size-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
        </Link>
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
  const [contactOpen, setContactOpen] = useState(false);
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

  return (
    <div id="top" className="bg-white text-neutral-900">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-2.5">
              <Image src={EAGLE} alt="Centurion crest" width={48} height={34} className="h-9 w-auto" />
              <div className="leading-none">
                <span className="block text-lg font-black tracking-[0.2em] text-neutral-900 uppercase">Centurion</span>
                <span className="block text-[8px] font-semibold tracking-[0.3em] text-neutral-500 uppercase">
                  by Entegra Coach®
                </span>
              </div>
            </div>
            <span className="mt-1 text-[9px] font-bold tracking-[0.22em] text-neutral-500 uppercase">
              Powered by <span style={{ color: GOLD }}>La Mesa RV</span>
            </span>
          </div>

          <nav className="hidden items-center gap-5 lg:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-xs font-bold tracking-wider text-neutral-600 uppercase transition hover:text-neutral-900"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {isAvailable && (
              <button
                type="button"
                onClick={() => setSeeLiveOpen(true)}
                className="hidden items-center justify-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 py-2 text-[11px] font-extrabold tracking-wide text-neutral-900 uppercase transition hover:bg-neutral-50 sm:flex"
              >
                <Video className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                See it live
              </button>
            )}
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              className="flex items-center justify-center gap-1.5 rounded-md px-3.5 py-2 text-[11px] font-extrabold tracking-wide text-neutral-900 uppercase shadow-sm transition hover:opacity-90"
              style={{ backgroundColor: GOLD }}
            >
              <DollarSign className="size-4 shrink-0" strokeWidth={2.5} aria-hidden />
              Get best price
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="border-b border-neutral-200 bg-gradient-to-b from-[#FBF7EE] to-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 md:py-20 lg:grid-cols-2">
          <div className="max-w-xl">
            <span className="text-xs font-bold tracking-[0.28em] uppercase" style={{ color: GOLD }}>
              Luxury Super C
            </span>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-neutral-900 uppercase sm:text-5xl md:text-6xl">
              Entegra
              <span className="block" style={{ color: GOLD }}>
                Centurion
              </span>
            </h1>
            <p className="mt-3 text-base font-semibold text-neutral-600 sm:text-lg">
              Built on the Freightliner® Cascadia® chassis with Detroit® diesel power — a true Super C motorhome,
              finished to order.
            </p>

            <GoldDivider />

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() => setContactOpen(true)}
                className="flex items-center justify-center gap-2 rounded-md px-7 py-3.5 text-sm font-extrabold tracking-wide text-neutral-900 uppercase shadow-sm transition hover:opacity-90"
                style={{ backgroundColor: GOLD }}
              >
                <DollarSign className="size-5 shrink-0" strokeWidth={2.5} aria-hidden />
                Get your best price
              </button>
              <a
                href="#inventory"
                className="flex items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-7 py-3.5 text-sm font-extrabold tracking-wide text-neutral-900 uppercase transition hover:bg-neutral-50"
              >
                Browse inventory
                <ArrowRight className="size-5 shrink-0" strokeWidth={2.5} aria-hidden />
              </a>
              {isAvailable && (
                <button
                  type="button"
                  onClick={() => setSeeLiveOpen(true)}
                  className="flex items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-7 py-3.5 text-sm font-extrabold tracking-wide text-neutral-900 uppercase transition hover:bg-neutral-50"
                >
                  <Video className="size-5 shrink-0" strokeWidth={2} aria-hidden />
                  See it live
                </button>
              )}
            </div>

            <p className="mt-5 text-sm text-neutral-500">
              Talk to a real Centurion specialist —{' '}
              <button
                type="button"
                onClick={openWidget}
                className="font-semibold text-neutral-900 underline decoration-[#C9A45B] underline-offset-4 hover:opacity-80"
              >
                connect now
              </button>
              , or{' '}
              <button
                type="button"
                onClick={() => openAi()}
                className="font-medium text-neutral-500 underline decoration-neutral-300 underline-offset-4 hover:text-neutral-700"
              >
                ask our AI a quick question
              </button>
              .
            </p>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-neutral-200 shadow-lg">
              <Image
                src={HERO_SCENE}
                alt="Entegra Centurion Super C motorhome"
                fill
                priority
                className="object-cover object-center"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
            </div>
            <div className="absolute -bottom-4 left-4 flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-lg sm:left-6">
              <BadgeCheck className="size-8 shrink-0" style={{ color: GOLD }} strokeWidth={1.75} aria-hidden />
              <div>
                <p className="text-base font-black text-neutral-900">2 + 3 Year Warranty</p>
                <p className="text-[11px] text-neutral-500">No one offers a better warranty</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Spec strip ─────────────────────────────────────── */}
      <section id="specs" className="border-b border-neutral-200 bg-[#FBF7EE]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 px-4 py-8 sm:px-6 md:grid-cols-3 lg:grid-cols-6">
          {SPECS.map(({ Icon, value, label }, i) => (
            <div
              key={value}
              className={`flex flex-col items-center gap-2 px-3 py-4 text-center ${i !== 0 ? 'lg:border-l lg:border-neutral-200' : ''}`}
            >
              <Icon className="size-7 shrink-0" style={{ color: GOLD }} strokeWidth={1.75} aria-hidden />
              <p className="text-sm font-black tracking-wide text-neutral-900 uppercase">{value}</p>
              <p className="text-[11px] leading-snug text-neutral-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Floorplans ─────────────────────────────────────── */}
      <section id="floorplans" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20">
        <SectionHeading kicker="Choose your floorplan" title="Three ways to command the road" />
        <p className="mt-3 max-w-2xl text-sm text-neutral-600 sm:text-base">
          42&apos; to 45&apos; 10&quot; · 104&quot; wide · sleeps up to 5. Every Centurion rides on a Freightliner®
          Cascadia chassis with Detroit® diesel power.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          {FLOORPLANS.map((fp) => (
            <div
              key={fp.name}
              className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:border-[#C9A45B] hover:shadow-md"
            >
              <div className="flex items-baseline justify-between">
                <h3 className="text-2xl font-black tracking-wide text-neutral-900 uppercase">Centurion {fp.name}</h3>
                <span className="text-sm font-bold" style={{ color: GOLD }}>
                  {fp.length}
                </span>
              </div>
              <div className="mt-4 flex flex-col gap-2 text-sm text-neutral-700">
                <p className="flex items-center gap-2">
                  <Truck className="size-4 shrink-0" style={{ color: GOLD }} strokeWidth={1.75} aria-hidden />
                  {fp.chassis}
                </p>
                <p className="flex items-center gap-2">
                  <Gauge className="size-4 shrink-0" style={{ color: GOLD }} strokeWidth={1.75} aria-hidden />
                  {fp.engine}
                </p>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-neutral-600">{fp.blurb}</p>
              <button
                type="button"
                onClick={() => setContactOpen(true)}
                className="mt-auto flex cursor-pointer items-center gap-1.5 pt-5 text-xs font-extrabold tracking-wide uppercase transition hover:opacity-80"
                style={{ color: GOLD }}
              >
                Request info on the {fp.name}
                <ArrowRight className="size-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <h3 className="text-xs font-bold tracking-[0.28em] uppercase" style={{ color: GOLD }}>
            Sikkens® full-body paint
          </h3>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3">
            {PAINT_COLORS.map((c) => (
              <div key={c.name} className="flex items-center gap-2">
                <span
                  className="size-7 rounded-full border border-neutral-300 shadow-inner"
                  style={{ backgroundColor: c.hex }}
                  aria-hidden
                />
                <span className="text-xs font-medium text-neutral-600">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Inventory carousel ─────────────────────────────── */}
      <section id="inventory" className="border-y border-neutral-200 bg-[#FBF7EE]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              kicker="Available now"
              title={loading ? 'Centurion coaches available' : `${units.length} Centurion coaches available`}
            />
            <Link
              href="/inventory"
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-4 py-2 text-xs font-extrabold tracking-wide text-neutral-900 uppercase transition hover:bg-neutral-50"
            >
              View all inventory
              <ArrowRight className="size-4 shrink-0" strokeWidth={2.5} aria-hidden />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-72 animate-pulse rounded-xl border border-neutral-200 bg-white" />
              ))}
            </div>
          ) : units.length === 0 ? (
            <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center shadow-sm">
              <p className="text-neutral-600">No Centurion coaches are loaded yet.</p>
              <button
                type="button"
                onClick={() => setContactOpen(true)}
                className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-md px-5 py-2.5 text-sm font-extrabold tracking-wide text-neutral-900 uppercase shadow-sm transition hover:opacity-90"
                style={{ backgroundColor: GOLD }}
              >
                Request availability
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
                      <CenturionCoachCard unit={unit} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="-left-3 size-10 border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50" />
                <CarouselNext className="-right-3 size-10 border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50" />
              </Carousel>
            </div>
          )}
        </div>
      </section>

      {/* ── How can we help (lead capture + specialist) ────── */}
      <section id="contact" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20">
        <SectionHeading kicker="No pressure, no obligation" title="How can we help?" />
        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Request pricing / info — primary lead capture */}
          <div className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="size-6 shrink-0" style={{ color: GOLD }} aria-hidden />
              <h3 className="text-lg font-black tracking-wide text-neutral-900 uppercase">Request pricing &amp; info</h3>
            </div>
            <p className="mt-2 text-sm text-neutral-600">
              Send your name, email, and phone and a Centurion specialist will reply with our best available price and
              availability — fast.
            </p>
            <ul className="mt-4 flex flex-col gap-3">
              {['Best price, every day', 'Typically a reply within minutes', "No obligation — you're in control"].map(
                (point) => (
                  <li key={point} className="flex items-center gap-2 text-sm text-neutral-700">
                    <CheckCircle2 className="size-5 shrink-0" style={{ color: GOLD }} aria-hidden />
                    {point}
                  </li>
                ),
              )}
            </ul>
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-extrabold tracking-wide text-neutral-900 uppercase shadow-sm transition hover:opacity-90"
              style={{ backgroundColor: GOLD }}
            >
              Get my best price
              <ArrowRight className="size-4 shrink-0" strokeWidth={2.5} aria-hidden />
            </button>
          </div>

          {/* Talk to a specialist */}
          <div className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <Users className="size-6 shrink-0" style={{ color: GOLD }} aria-hidden />
              <h3 className="text-lg font-black tracking-wide text-neutral-900 uppercase">Talk to a specialist</h3>
            </div>
            <p className="mt-2 text-sm text-neutral-600">
              Connect with a real Centurion expert who knows these coaches inside and out — no scripts, no pressure.
            </p>
            <ul className="mt-4 flex flex-col gap-3">
              {['Real people, real answers', 'Honest guidance', 'Built for the Centurion'].map((point) => (
                <li key={point} className="flex items-center gap-2 text-sm text-neutral-700">
                  <CheckCircle2 className="size-5 shrink-0" style={{ color: GOLD }} aria-hidden />
                  {point}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={openWidget}
              className="mt-auto flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-4 py-3 text-sm font-extrabold tracking-wide text-neutral-900 uppercase transition hover:bg-neutral-50"
            >
              <Phone className="size-4 shrink-0" strokeWidth={2.5} aria-hidden />
              Connect now
            </button>
          </div>

          {/* See it live (only when a specialist is online) */}
          {isAvailable ? (
            <div className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Video className="size-6 shrink-0" style={{ color: GOLD }} aria-hidden />
                <h3 className="text-lg font-black tracking-wide text-neutral-900 uppercase">See it live</h3>
              </div>
              <p className="mt-2 text-sm text-neutral-600">Real-time video walkthrough with a product specialist.</p>
              <button
                type="button"
                onClick={() => setSeeLiveOpen(true)}
                className="group relative mt-4 flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100"
              >
                <Image src={HERO_SCENE} alt="" fill className="object-cover transition group-hover:scale-105" sizes="400px" />
                <span className="relative flex size-14 items-center justify-center rounded-full bg-white/90 shadow-md ring-2 ring-[#C9A45B] transition group-hover:scale-110">
                  <Play className="size-6 translate-x-0.5 text-neutral-900" fill="currentColor" aria-hidden />
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSeeLiveOpen(true)}
                className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-extrabold tracking-wide text-neutral-900 uppercase shadow-sm transition hover:opacity-90"
                style={{ backgroundColor: GOLD }}
              >
                <Video className="size-4 shrink-0" strokeWidth={2.5} aria-hidden />
                See it live now
              </button>
            </div>
          ) : (
            <div className="flex flex-col justify-center rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Phone className="size-6 shrink-0" style={{ color: GOLD }} aria-hidden />
                <h3 className="text-lg font-black tracking-wide text-neutral-900 uppercase">Call or email</h3>
              </div>
              <ul className="mt-4 flex flex-col gap-3 text-sm text-neutral-700">
                <li className="flex items-center gap-2">
                  <Phone className="size-4 shrink-0" style={{ color: GOLD }} aria-hidden /> (239) 999-0928
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="size-4 shrink-0" style={{ color: GOLD }} aria-hidden /> info@lamesarv.com
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="size-4 shrink-0" style={{ color: GOLD }} aria-hidden /> Fort Myers, FL
                </li>
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* ── Trust bar ──────────────────────────────────────── */}
      <section className="border-y border-neutral-200 bg-[#FBF7EE]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-6 px-4 py-8 sm:px-6 md:grid-cols-5 md:gap-0">
          {TRUST_BAR.map(({ Icon, title, sub }, i) => (
            <div
              key={title}
              className={`flex items-center gap-3 px-2 md:justify-center ${i !== 0 ? 'md:border-l md:border-neutral-200' : ''}`}
            >
              <Icon className="size-7 shrink-0" style={{ color: GOLD }} strokeWidth={1.75} aria-hidden />
              <div>
                <p className="text-xs font-extrabold tracking-wide text-neutral-900 uppercase">{title}</p>
                <p className="text-[11px] text-neutral-500">{sub}</p>
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
            <h2 className="mt-2 text-2xl font-black tracking-tight text-neutral-900 uppercase sm:text-3xl md:text-4xl">
              The ultimate Super C experience
            </h2>
            <ul className="mt-6 flex flex-col gap-3">
              {WHY_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm text-neutral-700 sm:text-base">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0" style={{ color: GOLD }} aria-hidden />
                  {point}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              className="mt-7 inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-extrabold tracking-wide text-neutral-900 uppercase shadow-sm transition hover:opacity-90"
              style={{ backgroundColor: GOLD }}
            >
              Request pricing
              <ArrowRight className="size-4 shrink-0" strokeWidth={2.5} aria-hidden />
            </button>
          </div>

          <div className="relative min-h-[380px] overflow-hidden rounded-2xl border border-neutral-200 shadow-lg">
            <Image src={EMPEROR_SCENE} alt="The Entegra Centurion Super C" fill className="object-cover object-center" sizes="(min-width: 1024px) 50vw, 100vw" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6 sm:p-8">
              <p className="text-xl font-black tracking-tight text-white uppercase sm:text-2xl">
                The most powerful Super C, finished to order.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Closing CTA ────────────────────────────────────── */}
      <section
        className="border-y border-neutral-200"
        style={{ background: `linear-gradient(90deg, #F4E9D2 0%, #FBF7EE 50%, #F4E9D2 100%)` }}
      >
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-12 text-center sm:px-6 md:flex-row md:text-left">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-neutral-900 uppercase sm:text-3xl md:text-4xl">
              The road is calling.
              <span className="md:ml-2 md:inline" style={{ color: GOLD }}>
                The Centurion is ready.
              </span>
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              Limited inventory. Limitless destinations. Tell us what you&apos;re looking for and we&apos;ll take it from
              there.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setContactOpen(true)}
            className="flex shrink-0 items-center justify-center gap-2 rounded-md px-7 py-4 text-sm font-extrabold tracking-wide text-neutral-900 uppercase shadow-sm transition hover:opacity-90"
            style={{ backgroundColor: GOLD }}
          >
            <DollarSign className="size-5 shrink-0" strokeWidth={2.5} aria-hidden />
            Get your best price
          </button>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-neutral-200 bg-[#FBF7EE]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-12 sm:px-6 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <Image src={EAGLE} alt="" width={40} height={28} className="h-8 w-auto" />
              <div className="leading-none">
                <p className="text-base font-black tracking-[0.18em] text-neutral-900 uppercase">La Mesa RV</p>
                <p className="mt-0.5 text-[10px] tracking-[0.2em] text-neutral-500 uppercase">Experience life</p>
              </div>
            </div>
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-neutral-500">
              Home of the Entegra Centurion Super C. Real answers, real time, real people.
            </p>
          </div>

          <div>
            <p className="text-xs font-extrabold tracking-wide uppercase" style={{ color: GOLD }}>
              Contact
            </p>
            <ul className="mt-4 flex flex-col gap-2 text-xs text-neutral-600">
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
            <ul className="mt-4 flex flex-col gap-2 text-xs text-neutral-600">
              {FOOTER_QUICK.map((item) => (
                <li key={item}>
                  <a href="#inventory" className="transition hover:text-neutral-900">
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
            <ul className="mt-4 flex flex-col gap-2 text-xs text-neutral-600">
              {FOOTER_RESOURCES.map((item) => (
                <li key={item}>
                  <a href="#contact" className="transition hover:text-neutral-900">
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
                  className="flex size-9 items-center justify-center rounded-full border border-neutral-300 text-neutral-500 transition hover:border-neutral-400 hover:text-neutral-900"
                >
                  <Icon className="size-4" aria-hidden />
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-200 py-4">
          <p className="text-center text-[11px] text-neutral-500">
            © {new Date().getFullYear()} La Mesa RV. All rights reserved. · Centurion by Entegra Coach
          </p>
        </div>
      </footer>

      {/* ── Floating AI chat icon (subtle, secondary) ──────── */}
      <button
        type="button"
        aria-label="Ask the Centurion AI a question"
        onClick={() => openAi()}
        className="fixed right-4 bottom-6 z-50 flex size-12 cursor-pointer items-center justify-center rounded-full border border-neutral-300 bg-white shadow-lg transition hover:bg-neutral-50 sm:right-6"
      >
        <MessageCircle className="size-5 shrink-0" style={{ color: GOLD }} strokeWidth={2} aria-hidden />
      </button>

      <ContactDialog open={contactOpen} onOpenChange={setContactOpen} />
      <LiveChatDialog open={chatOpen} onOpenChange={setChatOpen} chatContext={chatContext} />
      <SeeLiveDialog open={seeLiveOpen} onOpenChange={setSeeLiveOpen} featuredUnits={units} />
    </div>
  );
}
