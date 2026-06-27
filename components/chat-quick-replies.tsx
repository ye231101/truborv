'use client';

import { type QuickReplyChip } from '@/lib/chat-intelligence';

type ChatQuickRepliesProps = {
  chips: QuickReplyChip[];
  onSelect: (message: string) => void;
  disabled?: boolean;
};

export function ChatQuickReplies({ chips, onSelect, disabled }: ChatQuickRepliesProps) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 pt-1.5">
      {chips.map((chip) => (
        <button
          key={chip.label}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(chip.message)}
          className="cursor-pointer rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-700 shadow-sm transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}
