interface UserMessageBubbleProps {
  content: string;
  timestamp?: string;
}

export function UserMessageBubble({ content, timestamp }: UserMessageBubbleProps) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] bg-primary-500 rounded-xl rounded-br-sm px-4 py-3">
        <p className="text-sm text-white leading-relaxed">{content}</p>
        {timestamp && <p className="text-xs text-white/60 mt-1 text-right">{timestamp}</p>}
      </div>
    </div>
  );
}
