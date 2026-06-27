'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import {
  ArrowRight,
  Bus,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  Cog,
  Download,
  Fuel,
  Gauge,
  Maximize,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Truck,
  User,
  Video,
} from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContactDialog } from '@/components/contact-dialog';
import { TextUsDialog } from '@/components/text-us-dialog';
import { useViewProWidget, type ViewProWidgetAgent } from '@/components/view-pro-widget-provider';
import {
  cn,
  formatLength,
  formatMileage,
  formatSleeps,
  formatPrice,
  rebateEndsLabel,
  labelFromCustomTags,
  getInventoryPricing,
} from '@/lib/utils';
import { AVATAR_URL } from '@/lib/constants';
import { type InventoryUnit } from '@/lib/types';

const APR_RATE = 7.99;
const PAYMENT_ESTIMATE_TERM_MONTHS = 240;

function TabPanelCard({
  title,
  children,
  footer,
  contentClassName,
}: {
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  contentClassName?: string;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-neutral-200/95 bg-white shadow-sm">
      <div className="flex flex-col">
        <div className="px-4 py-6 sm:px-6 sm:py-8">
          {title && <h2 className="text-xl font-bold tracking-tight text-neutral-900 md:text-2xl">{title}</h2>}
          <div className={cn('mt-4 text-[15px] leading-relaxed text-neutral-700 md:text-base', contentClassName)}>
            {children}
          </div>
        </div>
        {footer}
      </div>
    </section>
  );
}

function monthlyPayment(principal: number, annualApr: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  const r = annualApr / 100 / 12;
  if (r <= 0) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}

export function InventoryDetail({ unit }: { unit: InventoryUnit }) {
  const { isAvailable, agents, open } = useViewProWidget();

  const [financePrice, setFinancePrice] = useState(0);
  const [financeDown, setFinanceDown] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [floorplanDialogOpen, setFloorplanDialogOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [textUsOpen, setTextUsOpen] = useState(false);

  const [slideIndex, setSlideIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const slides = useMemo(() => {
    const base =
      unit.images && unit.images.length > 0
        ? unit.images
        : unit.defaultImageUrl
          ? [unit.defaultImageUrl]
          : ['/images/photos_coming_soon.jpg'];
    return base;
  }, [unit.images, unit.defaultImageUrl]);

  const floorplanSrc = slides[slides.length - 1];

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
  });

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSlideIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const el = thumbRefs.current[slideIndex];
    if (!el) return;
    el.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [slideIndex, slides.length]);

  useEffect(() => {
    document.title = `${unit.title} | RECVAN`;
    return () => {
      document.title = 'RECVAN';
    };
  }, [unit.title]);

  const { msrp, currentPrice, savingAmount, rebateAmount } = getInventoryPricing(unit);
  const rebateFootnote = rebateAmount && unit.rebate ? rebateEndsLabel(unit.rebate.enddate) : null;
  const fullBrochureUrl = unit.fullBrochure?.trim();
  const msrpUrl = unit.msrp?.trim();

  const chassisLabel = labelFromCustomTags(unit.customTags, 'chassis');
  const rvTypeLabel = labelFromCustomTags(unit.customTags, 'rvType');
  const driveTrainLabel = labelFromCustomTags(unit.customTags, 'driveTrain');
  const sleepsLabel = formatSleeps(unit.sleepsCount);

  useEffect(() => {
    setFinancePrice(Math.round(currentPrice));
    setFinanceDown(Math.round(currentPrice * 0.1));
  }, [currentPrice, unit.id]);

  const downPayment = Math.min(financeDown, financePrice);
  const principal = Math.max(0, financePrice - downPayment);
  const estimatedMonthly = monthlyPayment(principal, APR_RATE, PAYMENT_ESTIMATE_TERM_MONTHS);

  const quickHeroSpecs = [
    rvTypeLabel ? `${rvTypeLabel}` : null,
    chassisLabel ? `${chassisLabel}` : null,
    driveTrainLabel ? `${driveTrainLabel}` : null,
    sleepsLabel ? `${sleepsLabel}` : null,
  ]
    .filter(Boolean)
    .join(' • ');

  const specs: { icon: typeof Gauge; label: string; value: string }[] = [
    { icon: Bus, label: 'RV Type', value: rvTypeLabel || '—' },
    { icon: Car, label: 'Chassis', value: chassisLabel || '—' },
    { icon: Ruler, label: 'Length', value: formatLength(unit.wI_Length) || '—' },
    { icon: Gauge, label: 'Sleeps', value: formatSleeps(unit.sleepsCount) || '—' },
    { icon: Gauge, label: 'Mileage', value: formatMileage(unit.wI_Mileage) || '—' },
    { icon: Cog, label: 'Engine', value: unit.wI_Engine || '—' },
    { icon: Fuel, label: 'Fuel Type', value: unit.wI_Fuel || '—' },
    { icon: Truck, label: 'Drive Train', value: driveTrainLabel || '—' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 md:pb-20">
      <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/inventory"
          className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-neutral-900 transition hover:underline"
        >
          <ChevronLeft className="size-4" />
          Back to Inventory
        </Link>
        <Breadcrumb className="min-w-0">
          <BreadcrumbList className="flex-wrap text-neutral-600">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/inventory">Inventory</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="max-w-[min(100%,12rem)] truncate sm:max-w-[20rem] md:max-w-none">
                {unit.title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start lg:gap-12">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="relative aspect-4/3 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 shadow-sm">
            <div className="h-full overflow-hidden" ref={emblaRef}>
              <div className="flex h-full touch-pan-y">
                {slides.map((src: string, i: number) => (
                  <div key={`${unit.id}-detail-${i}`} className="relative min-w-0 shrink-0 grow-0 basis-full">
                    <img src={src} alt="" className="h-full w-full object-cover" loading={i === 0 ? 'eager' : 'lazy'} />
                  </div>
                ))}
              </div>
            </div>

            {isAvailable && (
              <div className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-bold tracking-wide text-white shadow-md">
                <span className="size-2 rounded-full bg-white" aria-hidden />
                AVAILABLE TO SEE LIVE
              </div>
            )}

            {canScrollPrev && (
              <button
                type="button"
                aria-label="Previous photo"
                className="absolute top-1/2 left-2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-neutral-800 shadow-md transition hover:bg-white"
                onClick={() => emblaApi?.scrollPrev()}
              >
                <ChevronLeft className="size-6" strokeWidth={2} />
              </button>
            )}
            {canScrollNext && (
              <button
                type="button"
                aria-label="Next photo"
                className="absolute top-1/2 right-2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-neutral-800 shadow-md transition hover:bg-white"
                onClick={() => emblaApi?.scrollNext()}
              >
                <ChevronRight className="size-6" strokeWidth={2} />
              </button>
            )}
          </div>

          {slides.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5">
              {slides.map((src, i) => (
                <button
                  key={`${unit.id}-thumb-${i}`}
                  ref={(node) => {
                    thumbRefs.current[i] = node;
                  }}
                  type="button"
                  onClick={() => emblaApi?.scrollTo(i)}
                  className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                    i === slideIndex
                      ? 'border-primary ring-primary/30 ring-1'
                      : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                  aria-label={`Photo ${i + 1}`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            {unit.wI_InventoryType === 'New' ? (
              <span className="rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">New</span>
            ) : (
              <span className="rounded-md bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-800">Used</span>
            )}
            {(unit.isSpecialOffer || unit.inFlashSale) && (
              <span className="rounded bg-[#1e4d8b] px-2.5 py-1 text-xs font-bold tracking-wide text-white uppercase">
                Best value
              </span>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl lg:text-[1.85rem] xl:text-4xl">
              {unit.title}
            </h1>
            {quickHeroSpecs && <p className="mt-2 text-sm text-neutral-600 md:text-base">{quickHeroSpecs}</p>}
          </div>

          {!currentPrice ? (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-center">
              <p className="text-sm font-semibold text-neutral-800">Call for price</p>
              <p className="text-muted-foreground mt-1 text-sm">Our price is too low to advertise online.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex flex-wrap items-end gap-3">
                <p className="text-4xl font-bold tracking-tight text-neutral-900 tabular-nums sm:text-[2.75rem]">
                  {formatPrice(currentPrice)}
                </p>
                {msrp > currentPrice ? (
                  <p className="text-lg text-neutral-500 tabular-nums line-through">{formatPrice(msrp)}</p>
                ) : null}
              </div>
              {savingAmount > 0 ? (
                <p className="text-base font-semibold text-emerald-600">Save {formatPrice(savingAmount)}</p>
              ) : null}
              {rebateFootnote ? <p className="text-muted-foreground text-xs">{rebateFootnote}</p> : null}
            </div>
          )}

          {fullBrochureUrl || msrpUrl ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              {fullBrochureUrl ? (
                <a
                  href={fullBrochureUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-md border border-neutral-300 bg-transparent px-4 py-3 text-xs font-bold tracking-wide text-neutral-900 uppercase transition hover:bg-neutral-50"
                >
                  Full Brochure
                  <Download className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                </a>
              ) : null}
              {msrpUrl ? (
                <a
                  href={msrpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-md border border-neutral-300 bg-transparent px-4 py-3 text-xs font-bold tracking-wide text-neutral-900 uppercase transition hover:bg-neutral-50"
                >
                  MSRP
                  <Download className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                </a>
              ) : null}
            </div>
          ) : null}

          {currentPrice ? (
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              className="flex w-full cursor-pointer items-stretch overflow-hidden rounded-lg border border-neutral-300 bg-neutral-50 text-left transition hover:bg-neutral-100/80"
            >
              <div className="flex flex-1 flex-col justify-center border-r border-neutral-300 px-4 py-3 sm:py-4">
                <p className="text-lg font-bold text-neutral-900 tabular-nums sm:text-xl">
                  {formatPrice(estimatedMonthly)}
                  <span className="text-sm font-semibold text-neutral-600">/mo*</span>
                </p>
                <p className="text-xs font-medium text-neutral-500">Est. payment</p>
              </div>
              <div className="flex flex-1 items-center justify-between gap-2 px-4 py-3 sm:py-4">
                <div>
                  <p className="text-sm font-bold text-neutral-900">Get Pre-Approved</p>
                  <p className="text-xs text-neutral-600">No impact to credit score</p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-neutral-500" aria-hidden />
              </div>
            </button>
          ) : null}

          {isAvailable && (
            <button
              type="button"
              onClick={open}
              className="flex w-full cursor-pointer items-center justify-center gap-4 rounded-lg bg-neutral-950 px-4 py-3.5 text-base font-bold text-white shadow-sm transition hover:bg-neutral-900"
            >
              <Video className="size-8 shrink-0" strokeWidth={2} aria-hidden />
              <div className="text-left">
                <p className="text-base font-bold text-white">See This Van Live</p>
                <p className="text-xs text-white">Talk to a specialist now</p>
              </div>
            </button>
          )}

          {isAvailable && (
            <button
              type="button"
              onClick={() => setTextUsOpen(true)}
              className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm font-bold text-neutral-900 transition hover:bg-neutral-50"
            >
              <Smartphone className="size-5 shrink-0" strokeWidth={2} aria-hidden />
              <div className="text-left">
                <p className="text-sm font-bold text-neutral-900">Text Us</p>
                <p className="text-xs text-neutral-600">Fast response</p>
              </div>
            </button>
          )}
        </div>
      </div>

      {isAvailable ? (
        <section className="mt-6 rounded-xl bg-white px-4 py-8 sm:mt-8 sm:px-8 sm:py-10 lg:mt-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
            <div className="max-w-xl">
              <div className="flex flex-row items-center gap-4">
                <div className="flex shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-neutral-100 p-2 sm:p-3">
                  <Video className="size-10 text-neutral-900" strokeWidth={1.5} aria-hidden />
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">
                    Walk around this van. Live.
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-neutral-700 md:text-base">
                    Our specialists can show you anything, inside and out.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={open}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-neutral-900"
              >
                <Video className="size-5 shrink-0" strokeWidth={2} aria-hidden />
                See This Van Live
              </button>
            </div>
            <div className="flex flex-col items-start gap-3 lg:items-end">
              {agents.length > 0 ? (
                <div className="flex items-center -space-x-2">
                  {agents.slice(0, 3).map((agent: ViewProWidgetAgent) => (
                    <div key={agent.username} className="relative shrink-0">
                      <Image
                        src={AVATAR_URL + agent.avatar}
                        alt=""
                        width={56}
                        height={56}
                        className="size-14 rounded-full border-4 border-white object-cover shadow-md"
                      />
                      <span
                        className="absolute right-0 bottom-0 size-3.5 rounded-full border-2 border-white bg-emerald-500"
                        aria-hidden
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex size-14 items-center justify-center rounded-full border border-dashed border-neutral-300 bg-white text-xs font-medium text-neutral-500">
                  Team
                </div>
              )}
              <p className="text-sm font-medium text-neutral-800">Specialists online until 7:00 PM PT</p>
            </div>
          </div>
        </section>
      ) : null}

      <div className="mt-6 sm:mt-8 lg:mt-10">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 flex h-auto w-full flex-nowrap justify-start gap-x-1 gap-y-0 overflow-x-auto overflow-y-hidden rounded-none border-b border-neutral-300/80 bg-transparent p-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(
              [
                ['overview', 'Overview'],
                ['floorplan', 'Floorplan'],
                ['specs', 'Specs'],
                ['compare', 'Compare'],
              ] as const
            ).map(([id, label]) => (
              <TabsTrigger
                key={id}
                value={id}
                className={cn(
                  'rounded-none border-0 border-b-[3px] border-transparent bg-transparent px-2.5 py-3 text-[11px] font-semibold tracking-wide text-neutral-500 uppercase shadow-none sm:px-4 sm:text-xs',
                  'data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-bold data-[state=active]:text-neutral-900 data-[state=active]:shadow-none',
                )}
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="mt-0 space-y-6">
            {(unit.richText || unit.features.length > 0) && (
              <div className="min-w-0 space-y-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4 sm:p-6 lg:p-8">
                {unit.richText ? (
                  <div
                    className="prose prose-sm max-w-none text-neutral-700"
                    dangerouslySetInnerHTML={{ __html: unit.richText }}
                  />
                ) : null}

                {unit.features.length > 0 && (
                  <div className="flex flex-col gap-4">
                    <h2 className="text-primary text-xl font-bold md:self-center lg:text-[1.75rem]">
                      Standard Features May Include:
                    </h2>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {unit.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2">
                          <Check className="size-4 shrink-0 text-green-600" strokeWidth={4} aria-hidden />
                          <p className="text-xs font-medium text-neutral-800 sm:text-sm">{feature}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <TabPanelCard
              title="Why shoppers choose us"
              contentClassName="space-y-4"
              footer={
                <div className="bg-neutral-50 p-4 sm:p-6">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-6 xl:gap-10">
                    <div className="flex gap-4 lg:min-w-0 lg:flex-1">
                      <ShoppingBag className="size-10 shrink-0 text-neutral-700" strokeWidth={1.5} aria-hidden />
                      <div className="min-w-0">
                        <p className="font-bold text-neutral-900">Real Inventory</p>
                        <p className="mt-1 text-sm leading-snug text-neutral-600">Updated in real time</p>
                      </div>
                    </div>
                    <div className="flex gap-4 lg:min-w-0 lg:flex-1">
                      <ShieldCheck className="size-10 shrink-0 text-neutral-700" strokeWidth={1.5} aria-hidden />
                      <div className="min-w-0">
                        <p className="font-bold text-neutral-900">Best Price Guarantee</p>
                        <p className="mt-1 text-sm leading-snug text-neutral-600">
                          We&apos;ll always give you our best price.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 lg:min-w-0 lg:flex-1">
                      <User className="size-10 shrink-0 text-neutral-700" strokeWidth={1.5} aria-hidden />
                      <div className="min-w-0">
                        <p className="font-bold text-neutral-900">No Hidden Fees</p>
                        <p className="mt-1 text-sm leading-snug text-neutral-600">No pressure. Just real savings.</p>
                      </div>
                    </div>
                  </div>
                </div>
              }
            >
              <p>
                Every listing is backed by specialists who know these vans inside and out — from electrical systems to
                delivery logistics.
              </p>
            </TabPanelCard>
          </TabsContent>

          <TabsContent value="floorplan" className="mt-0">
            <TabPanelCard title="Floorplan">
              <div className="relative overflow-hidden rounded-lg bg-neutral-50">
                <img
                  src={floorplanSrc}
                  alt="RV floorplan diagram"
                  className="mx-auto max-h-[420px] w-full object-contain p-6"
                />
                <button
                  type="button"
                  onClick={() => setFloorplanDialogOpen(true)}
                  className="absolute top-4 right-4 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white p-2 text-sm font-bold text-neutral-900 transition hover:bg-neutral-50"
                >
                  <Maximize className="size-5 shrink-0" strokeWidth={2} aria-hidden />
                </button>
              </div>
            </TabPanelCard>
          </TabsContent>

          <TabsContent value="specs" className="mt-0 space-y-6">
            <TabPanelCard title="Specifications">
              <div className="grid gap-3 sm:grid-cols-2">
                {specs.map(({ icon: Icon, label, value }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 rounded-lg border border-neutral-200/90 bg-[#F8F9FA] px-4 py-3.5"
                  >
                    <Icon className="size-8 shrink-0 text-neutral-600" strokeWidth={1.75} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-neutral-500">{label}</p>
                      <p className="font-semibold text-neutral-900">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabPanelCard>
          </TabsContent>

          <TabsContent value="compare" className="mt-0">
            <TabPanelCard title="Compare inventory">
              <p>
                Open other listings in a new tab and use stock numbers to compare with your specialist during a live
                session.
              </p>
              <Link
                href="/inventory"
                className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-neutral-900 underline-offset-4 hover:underline"
              >
                Browse more inventory
                <ArrowRight className="size-4 shrink-0" />
              </Link>
            </TabPanelCard>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={floorplanDialogOpen} onOpenChange={setFloorplanDialogOpen}>
        <DialogContent
          showCloseButton
          className="fixed inset-0 z-50 flex h-screen max-h-screen w-screen max-w-none translate-x-0 translate-y-0 flex-col rounded-none border-0 bg-black p-0 sm:max-w-none [&>button]:text-white"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Floorplan</DialogTitle>
            <DialogDescription>Full screen floorplan image for {unit.title}</DialogDescription>
          </DialogHeader>
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-3 sm:p-4">
            <img
              src={floorplanSrc}
              alt={`Floorplan for ${unit.title}`}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>

      <ContactDialog open={contactOpen} onOpenChange={setContactOpen} unit={unit} />
      <TextUsDialog open={textUsOpen} onOpenChange={setTextUsOpen} unit={unit} />
    </div>
  );
}
