'use client';

import { ChevronDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn, locationRegionOptions, locationOptions } from '@/lib/utils';

export type LocationMultiSelectProps = {
  selected: string[];
  onChange: (selected: string[]) => void;
  triggerClassName?: string;
  contentClassName?: string;
  emptySummaryLabel?: string;
  fieldLabel?: string;
};

function summaryLabel(selected: string[], emptySummaryLabel: string): string {
  if (selected.length === 0) return emptySummaryLabel;
  if (selected.length === 1) {
    return locationOptions.find((opt) => opt.value === selected[0])?.label ?? selected[0];
  }
  return `${selected.length} locations`;
}

function locationLabel(value: string): string {
  return locationOptions.find((opt) => opt.value === value)?.label ?? value;
}

export function LocationMultiSelect({
  selected,
  onChange,
  triggerClassName,
  contentClassName,
  emptySummaryLabel = 'All locations',
  fieldLabel,
}: LocationMultiSelectProps) {
  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  const toggleRegion = (regionValues: readonly string[]) => {
    const allSelected = regionValues.every((v) => selected.includes(v));
    if (allSelected) {
      onChange(selected.filter((v) => !regionValues.includes(v)));
      return;
    }
    const next = new Set(selected);
    regionValues.forEach((v) => next.add(v));
    onChange([...next]);
  };

  const regionCheckboxState = (regionValues: readonly string[]) => {
    const count = regionValues.filter((v) => selected.includes(v)).length;
    if (count === 0) return false as const;
    if (count === regionValues.length) return true as const;
    return 'indeterminate' as const;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex h-auto w-full min-w-0 rounded-md text-left text-base font-medium outline-none focus-visible:ring-0',
            fieldLabel
              ? 'min-h-[52px] flex-col items-stretch justify-center gap-0.5'
              : 'items-center justify-between gap-2',
            triggerClassName,
          )}
        >
          {fieldLabel ? (
            <>
              <span className="text-[10px] font-semibold tracking-wider text-neutral-500 uppercase">{fieldLabel}</span>
              <span className="flex min-w-0 items-center justify-between gap-2">
                <span className="truncate text-base font-bold text-neutral-900">
                  {summaryLabel(selected, emptySummaryLabel)}
                </span>
                <ChevronDown className="text-primary size-4 shrink-0" aria-hidden />
              </span>
            </>
          ) : (
            <>
              <span className="truncate">{summaryLabel(selected, emptySummaryLabel)}</span>
              <ChevronDown className="size-4 shrink-0 text-neutral-500" aria-hidden />
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn('z-60 w-[min(100%,var(--radix-popover-trigger-width))] p-0', contentClassName)}
      >
        <div
          className="max-h-[min(24rem,var(--radix-popover-content-available-height))] touch-pan-y overflow-y-auto overscroll-contain"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-4 p-3">
            {locationRegionOptions.map((region) => (
              <div key={region.id} role="group" aria-label={region.label}>
                <label className="mb-1 flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm font-semibold hover:bg-neutral-200">
                  <Checkbox
                    checked={regionCheckboxState(region.values)}
                    onCheckedChange={() => toggleRegion(region.values)}
                    className="data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary dark:data-[state=indeterminate]:bg-primary shrink-0 border-neutral-500 data-[state=indeterminate]:shadow-[inset_0_0_0_2px_white] data-[state=indeterminate]:[&_svg]:hidden"
                  />
                  <span className="text-black">{region.label}</span>
                </label>
                <div className="flex flex-col gap-0.5 pl-4">
                  {region.values.map((value) => (
                    <label
                      key={value}
                      className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-neutral-200"
                    >
                      <Checkbox
                        checked={selected.includes(value)}
                        onCheckedChange={() => toggle(value)}
                        className="shrink-0 border-neutral-500"
                      />
                      <span className="min-w-0 leading-snug text-black">{locationLabel(value)}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
