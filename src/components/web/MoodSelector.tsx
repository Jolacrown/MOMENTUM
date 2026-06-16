'use client';

interface MoodSelectorProps {
  selectedMood: number | null;
  onSelect: (value: number) => void;
}

const MOODS = [
  { value: 1, emoji: '😔', label: 'Low' },
  { value: 2, emoji: '😕', label: 'Meh' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '🔥', label: 'Great' },
];

export function MoodSelector({ selectedMood, onSelect }: MoodSelectorProps) {
  return (
    <div>
      <p className="text-sm font-semibold text-text-primary mb-3">How are you feeling today?</p>
      <div className="flex gap-3">
        {MOODS.map((mood) => {
          const active = selectedMood === mood.value;
          return (
            <button
              key={mood.value}
              type="button"
              onClick={() => onSelect(mood.value)}
              className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all duration-200 ${active ? 'border-primary-500 bg-primary-50' : 'border-border-base bg-bg-surface hover:border-primary-300'}`}
            >
              <span className="text-xl">{mood.emoji}</span>
              <span className={`text-xs font-semibold ${active ? 'text-primary-500' : 'text-text-muted'}`}>
                {mood.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
