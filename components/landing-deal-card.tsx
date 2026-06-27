'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import useEmblaCarousel from 'embla-carousel-react';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useViewProWidget } from '@/components/view-pro-widget-provider';
import { cn, formatPrice, formatMileage, formatSleeps, getInventoryPricing, labelFromValue } from '@/lib/utils';
import { type InventoryUnit } from '@/lib/types';

type DealBadge = { label: string; className: string };

function pickDealBadge(unit: InventoryUnit): DealBadge | null {
  const { currentPrice } = getInventoryPricing(unit);

  if (!currentPrice) {
    return { label: 'Price drop', className: 'bg-primary text-primary-foreground' };
  }
  if (unit.inFlashSale || unit.isSpecialOffer) {
    return { label: 'Hot deal', className: 'bg-red-600 text-white' };
  }
  return null;
}

export function LandingDealCard({ unit }: { unit: InventoryUnit }) {
  const router = useRouter();
  const { isAvailable, open } = useViewProWidget();
  const [slideIndex, setSlideIndex] = useState(0);

  const slides = useMemo(() => {
    const base =
      unit.images && unit.images.length > 0
        ? unit.images
        : unit.defaultImageUrl
          ? [unit.defaultImageUrl]
          : ['/images/photos_coming_soon.jpg'];
    return base;
  }, [unit.images, unit.defaultImageUrl]);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start' });

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSlideIndex(emblaApi.selectedScrollSnap());
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

  const { msrp, currentPrice, savingAmount } = getInventoryPricing(unit);

  const specParts = [
    unit.wI_Body,
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
    .map((tag) => labelFromValue(tag.value));

  const badge = pickDealBadge(unit);

  return (
    <article
      onClick={() => router.push(`/inventory/${unit.id}`)}
      className="flex h-full min-h-0 min-w-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-shadow select-none hover:shadow-md"
    >
      <div className="relative">
        <div
          className="relative aspect-4/3 w-full overflow-hidden bg-neutral-100"
          ref={emblaRef}
          data-nested-embla-viewport=""
        >
          <div className="flex h-full min-h-0 w-full touch-pan-x flex-row flex-nowrap">
            {slides.map((src: string, i: number) => (
              <div key={`${unit.id}-landing-${i}`} className="relative min-h-0 min-w-0 shrink-0 grow-0 basis-full">
                <img
                  src={src}
                  alt=""
                  className="h-full max-h-full w-full object-cover object-center"
                  loading={i === 0 ? 'eager' : 'lazy'}
                />
              </div>
            ))}
          </div>
        </div>

        {badge ? (
          <div className="absolute top-3 left-3 z-10">
            <span
              className={cn(
                'rounded-md px-2.5 py-1 text-[10px] font-extrabold tracking-wide uppercase sm:text-[11px]',
                badge.className,
              )}
            >
              {badge.label}
            </span>
          </div>
        ) : null}

        {slides.length > 1 ? (
          <div className="pointer-events-none absolute right-3 bottom-3 z-10 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-medium text-white tabular-nums">
            <Camera className="size-3 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
            <span>
              {slideIndex + 1}/{slides.length}
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 pt-3.5 sm:p-5">
        <h3 className="line-clamp-2 text-sm font-extrabold tracking-wide text-neutral-900 uppercase sm:text-base">
          {unit.title}
        </h3>
        {specLine ? <p className="text-xs leading-snug text-neutral-500 sm:text-sm">{specLine}</p> : null}

        <div className="min-h-12">
          {!currentPrice ? (
            <p className="text-xl font-bold text-neutral-900">Call for price</p>
          ) : (
            <>
              <div className="flex flex-wrap items-baseline gap-2 gap-y-0">
                <span className="text-2xl font-bold tracking-tight text-neutral-900 tabular-nums">
                  {formatPrice(currentPrice)}
                </span>
                {msrp > currentPrice ? (
                  <span className="text-sm font-medium text-neutral-400 tabular-nums line-through">
                    {formatPrice(msrp)}
                  </span>
                ) : null}
              </div>
              {savingAmount > 0 ? (
                <p className="mt-1 text-sm font-semibold text-emerald-700 tabular-nums">
                  Save {formatPrice(savingAmount)}
                </p>
              ) : null}
            </>
          )}

          {tags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[11px] font-semibold text-neutral-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-1 sm:flex-row">
          {isAvailable && (
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                open();
              }}
              className="flex h-11 flex-1 cursor-pointer gap-1.5 rounded-lg border-neutral-300 bg-white text-[11px] font-extrabold tracking-wide text-neutral-900 uppercase hover:bg-neutral-50 hover:text-neutral-900 sm:text-xs"
            >
              <Camera className="size-4 shrink-0" strokeWidth={2} aria-hidden />
              See live
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              router.push(`/inventory/${unit.id}`);
            }}
            className="flex h-11 flex-1 cursor-pointer rounded-lg border-neutral-300 bg-white text-[11px] font-extrabold tracking-wide text-neutral-900 uppercase hover:bg-neutral-50 hover:text-neutral-900 sm:text-xs"
          >
            View details
          </Button>
        </div>
      </div>
    </article>
  );
}
