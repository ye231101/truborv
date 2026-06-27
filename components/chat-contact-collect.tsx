'use client';

import { useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { type UseFormRegister } from 'react-hook-form';
import { cn } from '@/lib/utils';
import {
  type CollectField,
  type ContactIntakeForm,
} from '@/lib/chat-contact-intake';

export function ChatContactCollectCard({
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
  register: UseFormRegister<ContactIntakeForm>;
  error?: string;
  watchValue: string;
  onSubmit: () => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputType = field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text';
  const autoComplete =
    field === 'email' ? 'email' : field === 'phone' ? 'tel' : field === 'callTime' ? 'off' : 'name';
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
