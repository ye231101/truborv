'use client';

/** Renders AI chat text with light structure for mobile (paragraphs + bullet lines). */
export function ChatAiMessageBody({ text }: { text: string }) {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {lines.map((line, index) => {
        const isBullet = line.startsWith('•') || line.startsWith('-');
        const isSpecialistHint = /connect you with a live rv specialist/i.test(line);

        if (isBullet) {
          return (
            <p key={index} className="text-sm font-medium text-neutral-800 tabular-nums">
              {line}
            </p>
          );
        }

        return (
          <p
            key={index}
            className={
              isSpecialistHint
                ? 'text-sm leading-snug text-neutral-600'
                : 'text-sm leading-snug text-neutral-800'
            }
          >
            {line}
          </p>
        );
      })}
    </div>
  );
}
