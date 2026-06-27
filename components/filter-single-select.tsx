'use client';

import { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

export type FilterSingleSelectProps = {
  options: readonly { label: string; value: string }[];
  value: string | null;
  onChange: (value: string | null) => void;
  emptyLabel: string;
  triggerClassName?: string;
  contentClassName?: string;
  'aria-label'?: string;
};

function triggerSummary(
  value: string | null,
  options: readonly { label: string; value: string }[],
  emptyLabel: string,
): string {
  if (value == null) return emptyLabel;
  return options.find((o) => o.value === value)?.label ?? value;
}

export function FilterSingleSelect({
  options,
  value,
  onChange,
  emptyLabel,
  triggerClassName,
  contentClassName,
  'aria-label': ariaLabel,
}: FilterSingleSelectProps) {
  const id = useId();
  const groupValue = value ?? 'any';

  return (
    <Popover modal={false}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex h-auto w-full min-w-0 items-center justify-between gap-2 rounded-md text-left text-base font-medium outline-none focus-visible:ring-0',
            triggerClassName,
          )}
          aria-label={ariaLabel}
        >
          <span className="truncate">{triggerSummary(value, options, emptyLabel)}</span>
          <ChevronDown className="size-4 shrink-0 text-neutral-500" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn('w-[min(100%,var(--radix-popover-trigger-width))] p-0', contentClassName)}
        onWheel={(e) => e.stopPropagation()}
      >
        <div className="max-h-[min(24rem,var(--radix-popover-content-available-height))] min-h-0 touch-pan-y overflow-y-auto overscroll-contain p-3">
          <RadioGroup
            value={groupValue}
            onValueChange={(v) => {
              if (v === 'any') onChange(null);
              else onChange(v);
            }}
            className="gap-0"
          >
            <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-neutral-200">
              <RadioGroupItem value="any" id={`${id}-any`} className="shrink-0 border-neutral-500" />
              <span className="min-w-0 leading-snug text-black">{emptyLabel}</span>
            </label>
            {options.map(({ label, value: optVal }) => (
              <label
                key={optVal}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-neutral-200"
              >
                <RadioGroupItem value={optVal} id={`${id}-${optVal}`} className="shrink-0 border-neutral-500" />
                <span className="min-w-0 leading-snug text-black">{label}</span>
              </label>
            ))}
          </RadioGroup>
        </div>
      </PopoverContent>
    </Popover>
  );
}
