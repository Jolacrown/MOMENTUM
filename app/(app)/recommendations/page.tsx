'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, ExternalLink, Bookmark, Palette, Layers, Smartphone } from 'lucide-react';
import Link from 'next/link';

interface Resource {
  id: string;
  title: string;
  provider: string;
  category: string;
  difficulty: string;
  duration: string;
  url: string;
  icon: string;
}

const RECOMMENDED: Resource[] = [
  { id: 'rec1', title: 'Figma 101: UI Design Fundamentals', provider: 'DesignLab', category: 'UI/UX Design', difficulty: 'Beginner', duration: '4 hours', url: 'https://www.figma.com/community', icon: 'Palette' },
  { id: 'rec2', title: 'React Native Crash Course', provider: 'Traversy Media', category: 'Mobile Development', difficulty: 'Intermediate', duration: '2 hours', url: 'https://www.youtube.com', icon: 'Smartphone' },
  { id: 'rec3', title: 'Design Thinking for Innovators', provider: 'IDEO U', category: 'Product Design', difficulty: 'Intermediate', duration: '6 weeks', url: 'https://www.ideou.com', icon: 'Layers' },
  { id: 'rec4', title: 'CSS Grid & Flexbox', provider: 'Web Dev Simplified', category: 'Web Development', difficulty: 'Beginner', duration: '45 min', url: 'https://www.youtube.com', icon: 'Smartphone' },
];

const ICON_MAP: Record<string, React.FC<{ size: number; className?: string }>> = {
  Palette, Layers, Smartphone,
};

const DIFF_COLORS: Record<string, string> = {
  Beginner: 'text-success-500 bg-success-50',
  Intermediate: 'text-warning-500 bg-warning-50',
  Advanced: 'text-error-500 bg-error-50',
};

export default function RecommendationsPage() {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [openingUrl, setOpeningUrl] = useState<string | null>(null);

  const toggleSave = (id: string) => {
    setSavedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handlePress = (url: string) => {
    setOpeningUrl(url);
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => setOpeningUrl(null), 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/app/resources" className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-display font-800 text-text-primary tracking-tight">Recommendations</h1>
          <p className="text-sm text-text-muted mt-0.5">Personalized for you</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {RECOMMENDED.map((resource) => {
          const Icon = ICON_MAP[resource.icon] || Palette;
          const isBookmarked = savedIds.includes(resource.id);
          const isOpening = openingUrl === resource.url;

          return (
            <div key={resource.id} className="bg-bg-surface rounded-xl border border-border-base shadow-sm hover:shadow-md transition-all overflow-hidden relative">
              {isOpening && (
                <div className="absolute inset-0 bg-bg-base/60 z-10 flex items-center justify-center">
                  <span className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                      <Icon size={18} className="text-primary-500" />
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${DIFF_COLORS[resource.difficulty]}`}>
                      {resource.difficulty}
                    </span>
                  </div>
                  <button onClick={() => toggleSave(resource.id)} className={`p-1.5 rounded-lg transition-colors ${isBookmarked ? 'text-primary-500 bg-primary-50' : 'text-text-muted hover:text-text-secondary'}`}>
                    <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <h3 className="text-sm font-bold font-display text-text-primary">{resource.title}</h3>
                <p className="text-xs text-text-muted">{resource.provider}</p>
                <div className="flex items-center gap-3 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-bg-elevated text-text-secondary font-medium">{resource.category}</span>
                  <span className="text-text-muted">{resource.duration}</span>
                </div>
                <button onClick={() => handlePress(resource.url)} className="flex items-center gap-1.5 text-xs font-bold text-primary-500 hover:text-primary-400">
                  <ExternalLink size={12} />
                  Start
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="h-10" />
    </div>
  );
}
