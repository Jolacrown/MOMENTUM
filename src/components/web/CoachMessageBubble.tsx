import { Sparkles } from 'lucide-react';

interface CoachMessageBubbleProps {
  content: string;
  timestamp?: string;
  isStreaming?: boolean;
}

export function CoachMessageBubble({ content, timestamp, isStreaming }: CoachMessageBubbleProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
        <Sparkles size={16} className="text-primary-500" />
      </div>
      <div className="flex-1 bg-bg-surface rounded-xl rounded-tl-sm p-4 border border-border-base border-l-4 border-l-primary-500">
        <p className="text-sm text-text-primary leading-relaxed">{content}</p>
        {isStreaming && (
          <div className="flex gap-1 mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
        {timestamp && <p className="text-xs text-text-muted mt-2">{timestamp}</p>}
      </div>
    </div>
  );
}
