'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Calendar, Camera, MessageCircle, Video, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import { useViewProWidget, type ViewProWidgetAgent } from '@/components/view-pro-widget-provider';
import { cn, formatMileage, formatPrice, formatSleeps, getInventoryPricing, labelFromValue } from '@/lib/utils';
import { AVATAR_URL } from '@/lib/constants';
import { type InventoryUnit } from '@/lib/types';

type SeeLiveDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featuredUnits: InventoryUnit[];
};

function LiveCard({ unit, onSeeLive }: { unit: InventoryUnit; onSeeLive: () => void }) {
  const router = useRouter();
  const { msrp, currentPrice, savingAmount } = getInventoryPricing(unit);

  const specParts = [
    unit.wI_Fuel,
    formatMileage(unit.wI_Mileage) || null,
    formatSleeps(unit.sleepsCount) || null,
  ].filter(Boolean) as string[];
  const specLine = specParts.join(' • ');

  const tags = unit.customTags
    .map((tag) => {
      const [key, value] = tag.split(':');
      return { key, value: value.trim() };
    })
    .filter((tag) => tag.key && tag.value && tag.key !== 'promotions')
    .map((tag) => labelFromValue(tag.value))
    .slice(0, 3);

  const imageSrc =
    unit.images && unit.images.length > 0
      ? unit.images[0]
      : unit.defaultImageUrl
        ? unit.defaultImageUrl
        : '/images/photos_coming_soon.jpg';

  return (
    <div
      onClick={() => router.push(`/inventory/${unit.id}`)}
      className="flex h-full min-h-0 min-w-0 cursor-pointer flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm select-none"
    >
      <div className="relative aspect-4/3 w-full overflow-hidden bg-neutral-100">
        <img src={imageSrc} alt="" className="h-full w-full object-cover object-center" loading="lazy" />
        <div className="absolute top-2 left-2 z-10">
          <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-white uppercase shadow-[0_0_0_1px_rgba(16,185,129,0.35)]">
            Live
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 text-xs font-extrabold tracking-wide text-neutral-900 uppercase sm:text-sm">
          {unit.title}
        </h3>
        {specLine ? <p className="mt-1 text-[11px] leading-snug text-neutral-500">{specLine}</p> : null}

        <div>
          {!currentPrice ? (
            <p className="text-base font-bold text-neutral-900">Call for price</p>
          ) : (
            <>
              <div className="flex flex-wrap items-baseline gap-1.5 gap-y-0">
                <span className="text-lg font-bold tracking-tight text-neutral-900 tabular-nums">
                  {formatPrice(currentPrice)}
                </span>
                {msrp > currentPrice ? (
                  <span className="text-xs font-medium text-neutral-400 tabular-nums line-through">
                    {formatPrice(msrp)}
                  </span>
                ) : null}
              </div>
              {savingAmount > 0 ? (
                <p className="mt-0.5 text-xs font-semibold text-emerald-700 tabular-nums">
                  Save {formatPrice(savingAmount)}
                </p>
              ) : null}
            </>
          )}
        </div>

        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] font-semibold text-neutral-600"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <Button
          type="button"
          onClick={onSeeLive}
          className="mt-auto h-9 w-full cursor-pointer gap-1.5 rounded-md bg-neutral-900 text-[11px] font-extrabold tracking-wide text-white uppercase hover:bg-neutral-800"
        >
          <Camera className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
          See live
        </Button>
      </div>
    </div>
  );
}

export function SeeLiveDialog({ open, onOpenChange, featuredUnits }: SeeLiveDialogProps) {
  const { isAvailable, agents, open: openViewProWidget } = useViewProWidget();
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  useEffect(() => {
    if (!open || !carouselApi) return;
    const id = requestAnimationFrame(() => {
      carouselApi.reInit();
    });
    return () => cancelAnimationFrame(id);
  }, [open, carouselApi, featuredUnits.length]);

  const handleConnect = () => {
    openViewProWidget();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="flex max-h-[min(90vh,calc(100%-2rem))] min-h-0 w-full max-w-4xl min-w-0 flex-col gap-0 overflow-hidden rounded-lg border-neutral-200 p-0 sm:max-w-4xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-neutral-200 px-5 py-4 sm:px-6">
          <DialogTitle className="flex flex-1 items-center justify-center gap-2 text-center text-base font-bold tracking-wide text-neutral-900 sm:text-lg">
            <Camera className="size-5 shrink-0" strokeWidth={2} aria-hidden />
            <span>See the Centurion live</span>
          </DialogTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md p-2 text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
            aria-label="Close"
          >
            <X className="size-5" strokeWidth={2} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
          <div className="border-b border-neutral-100 px-4 py-5 sm:px-6">
            <h2 className="text-center text-2xl font-black tracking-tight text-neutral-900 sm:text-3xl">
              See the Centurion in real time.
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-center text-sm leading-relaxed text-neutral-600 sm:text-base">
              Our team is standing by to show you the Centurion, inside and out.
            </p>
          </div>

          <div className="grid grid-cols-1 divide-y divide-neutral-200 px-4 py-5 sm:px-6 md:grid-cols-3 md:divide-x md:divide-y-0 md:py-6">
            {(
              [
                {
                  Icon: Video,
                  title: 'Live walkaround',
                  body: 'See the Centurion in real time from any angle.',
                },
                {
                  Icon: MessageCircle,
                  title: 'Ask questions',
                  body: 'Get answers about features, condition, history, and more.',
                },
                {
                  Icon: Calendar,
                  title: 'No pressure',
                  body: "Take your time. We're here to help.",
                },
              ] as const
            ).map(({ Icon, title, body }, i) => (
              <div
                key={title}
                className={cn(
                  'flex flex-col items-center gap-2 px-2 py-4 text-center md:py-0 md:pr-4 md:pl-4',
                  i === 0 && 'md:pl-0',
                  i === 2 && 'md:pr-0',
                )}
              >
                <Icon className="size-8 shrink-0" strokeWidth={1.75} aria-hidden />
                <p className="text-sm font-extrabold tracking-wide text-neutral-900 uppercase">{title}</p>
                <p className="max-w-56 text-xs leading-relaxed text-neutral-600 sm:text-sm">{body}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-neutral-100 px-4 py-5 sm:px-6 sm:py-6">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <h3 className="text-sm font-black tracking-wide text-neutral-900 uppercase sm:text-base">
                Centurion coaches live now
              </h3>
              <Link
                href="#inventory"
                className="text-primary hover:text-primary/85 inline-flex cursor-pointer items-center gap-1 text-xs font-extrabold tracking-wide uppercase sm:text-sm"
                onClick={() => onOpenChange(false)}
              >
                View all
                <ArrowRight className="size-4 shrink-0" strokeWidth={2} aria-hidden />
              </Link>
            </div>

            {featuredUnits.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">No coaches to show right now.</p>
            ) : (
              <div className="relative max-w-full min-w-0">
                <Carousel
                  setApi={setCarouselApi}
                  opts={{ align: 'start', dragFree: false }}
                  className="relative w-full min-w-0"
                >
                  <CarouselContent>
                    {featuredUnits.map((unit) => (
                      <CarouselItem
                        key={unit.id}
                        className="flex min-w-0 basis-[85%] pl-3 sm:basis-[46%] sm:pl-4 md:basis-[36%] lg:basis-[32%] xl:basis-1/4 2xl:pl-4"
                      >
                        <div className="w-full min-w-0">
                          <LiveCard unit={unit} onSeeLive={handleConnect} />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious
                    variant="outline"
                    className="top-1/2 left-1 z-10 size-9 -translate-y-1/2 border-neutral-200 bg-white/95 shadow-sm sm:left-2"
                  />
                  <CarouselNext
                    variant="outline"
                    className="top-1/2 right-1 z-10 size-9 -translate-y-1/2 border-neutral-200 bg-white/95 shadow-sm sm:right-2"
                  />
                </Carousel>
              </div>
            )}
          </div>

          {isAvailable && (
            <div className="border-t border-neutral-100 bg-neutral-50 px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                <div className="flex shrink-0 items-center gap-3">
                  {agents.length > 0 ? (
                    <div className="relative flex shrink-0 -space-x-2">
                      {agents.slice(0, 3).map((agent: ViewProWidgetAgent) => (
                        <div key={agent.username} className="relative shrink-0">
                          <Image
                            src={`${AVATAR_URL}${agent.avatar}`}
                            alt=""
                            width={64}
                            height={64}
                            className="rounded-full border-2 border-white object-cover"
                          />
                        </div>
                      ))}
                      <span
                        className="absolute -right-0.5 -bottom-0.5 z-10 size-3 rounded-full border-2 border-white bg-emerald-500"
                        aria-hidden
                      />
                    </div>
                  ) : (
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-full border-2 border-white bg-neutral-200">
                      <Image src="/images/robot.png" alt="" fill sizes="56px" className="object-cover" />
                      <span
                        className="absolute -right-0.5 -bottom-0.5 z-10 size-3 rounded-full border-2 border-white bg-emerald-500"
                        aria-hidden
                      />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black tracking-wide text-neutral-900 uppercase sm:text-base">
                    Connect with a Centurion specialist
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-600 sm:text-sm">
                    We&apos;re online and ready to show you the Centurion, answer questions, and help you find the right one.
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-emerald-700 sm:text-sm">
                    <span
                      className="size-2 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.25)]"
                      aria-hidden
                    />
                    <span>
                      {agents.length > 0
                        ? `${agents.length} ${agents.length === 1 ? 'specialist' : 'specialists'} online now`
                        : 'No specialists online'}
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleConnect}
                  className="h-11 w-full shrink-0 cursor-pointer gap-2 rounded-lg bg-neutral-900 px-6 text-xs font-extrabold tracking-wide text-white uppercase hover:bg-neutral-800 sm:w-auto sm:min-w-38"
                >
                  <Camera className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                  Connect now
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
