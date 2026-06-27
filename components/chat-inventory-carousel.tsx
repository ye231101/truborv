'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { formatPrice, getInventoryPricing, unitThumbnailSrc } from '@/lib/utils';
import { type InventoryUnit } from '@/lib/types';

type ChatInventoryCarouselProps = {
  units: InventoryUnit[];
  label?: string;
};

export function ChatInventoryCarousel({ units, label }: ChatInventoryCarouselProps) {
  if (units.length === 0) return null;

  return (
    <div className="relative mt-2 w-full min-w-0">
      {label ? (
        <p className="mb-1.5 pl-0.5 text-[11px] font-semibold tracking-wide text-neutral-600 uppercase">
          {label}
        </p>
      ) : null}
      <Carousel opts={{ align: 'start', dragFree: false }} className="relative w-full min-w-0">
        <CarouselContent className="-ml-2">
          {units.map((u) => {
            const specLine = [
              u.wI_Year ? String(u.wI_Year) : null,
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
  );
}
