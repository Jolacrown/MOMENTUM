'use client';

import { useState, useEffect } from 'react';
import {
  BookOpen, ExternalLink, Bookmark, Search,
  Palette, Layers, Smartphone, Monitor, GraduationCap, Users,
} from 'lucide-react';
import { getRecommendedResources } from '@/features/resources/resources.service';
import type { Resource as ServiceResource } from '@/features/resources/resources.service';
import { useAuthStore } from '@/stores/web/auth-store-web';

const FALLBACK_RESOURCES = [
  { id: 'r1', title: 'Figma 101: UI Design Fundamentals', provider: 'DesignLab', category: 'UI/UX Design', type: 'Course', difficulty: 'Beginner' as const, duration: '4 hours', url: 'https://www.figma.com/community', icon: 'Palette' },
  { id: 'r2', title: 'Design Thinking for Innovators', provider: 'IDEO U', category: 'Product Design', type: 'Course', difficulty: 'Intermediate' as const, duration: '6 weeks', url: 'https://www.ideou.com', icon: 'Layers' },
  { id: 'r3', title: 'React & Next.js Crash Course', provider: 'Traversy Media', category: 'Web Development', type: 'Tutorial', difficulty: 'Intermediate' as const, duration: '2 hours', url: 'https://www.youtube.com', icon: 'Monitor' },
  { id: 'r4', title: 'Web Development Bootcamp', provider: 'FreeCodeCamp', category: 'Web Development', type: 'Course', difficulty: 'Beginner' as const, duration: '300 hours', url: 'https://www.freecodecamp.org', icon: 'Monitor' },
  { id: 'r5', title: 'UX Research Methods', provider: 'Nielsen Norman Group', category: 'UI/UX Design', type: 'Article', difficulty: 'Advanced' as const, duration: '20 min', url: 'https://www.nngroup.com', icon: 'Palette' },
  { id: 'r6', title: 'Product Strategy Framework', provider: 'Stratechery', category: 'Product Design', type: 'Article', difficulty: 'Advanced' as const, duration: '15 min', url: 'https://stratechery.com', icon: 'Layers' },
  { id: 'r7', title: 'Flutter for Beginners', provider: 'Google Codelabs', category: 'Mobile Development', type: 'Tutorial', difficulty: 'Beginner' as const, duration: '3 hours', url: 'https://codelabs.developers.google.com', icon: 'Smartphone' },
  { id: 'r8', title: 'CSS Grid & Flexbox', provider: 'Web Dev Simplified', category: 'Web Development', type: 'Video', difficulty: 'Beginner' as const, duration: '45 min', url: 'https://www.youtube.com', icon: 'Monitor' },
  { id: 'r9', title: 'Leading Design Teams', provider: 'Design Better', category: 'Career Growth', type: 'Mentor', difficulty: 'Advanced' as const, duration: '12 weeks', url: 'https://www.designbetter.co', icon: 'Users' },
  { id: 'r10', title: 'Startup Financial Modeling', provider: 'Y Combinator', category: 'Entrepreneurship', type: 'Course', difficulty: 'Intermediate' as const, duration: '8 weeks', url: 'https://www.ycombinator.com', icon: 'GraduationCap' },
];

interface DisplayResource {
  id: string; title: string; provider: string; category: string;
  type: string; difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string; url: string; icon: string;
}

const RESOURCE_CATEGORIES = ['All', 'UI/UX Design', 'Product Design', 'Mobile Development', 'Web Development', 'Career Growth', 'Entrepreneurship'];
const TYPE_FILTERS = ['All', 'Course', 'Tutorial', 'Mentor', 'Video', 'Article'];

const ICON_MAP: Record<string, React.FC<{ size: number; className?: string }>> = { Palette, Layers, Smartphone, Monitor, BookOpen, GraduationCap, Users };

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: 'text-success-500 bg-success-50',
  Intermediate: 'text-warning-500 bg-warning-50',
  Advanced: 'text-error-500 bg-error-50',
};

function toDisplayResource(r: ServiceResource): DisplayResource {
  return {
    id: r.id,
    title: r.title,
    provider: r.provider,
    category: r.category,
    type: r.resource_type,
    difficulty: (r.skill_level as DisplayResource['difficulty']) || 'Beginner',
    duration: r.duration,
    url: r.resource_url,
    icon: 'BookOpen',
  };
}

export function ResourcesSection() {
  const { user } = useAuthStore();
  const [resources, setResources] = useState<DisplayResource[]>(FALLBACK_RESOURCES);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeType, setActiveType] = useState('All');
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [openingUrl, setOpeningUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchResources = async () => {
      setLoading(true);
      try {
        const data = await getRecommendedResources(
          activeCategory !== 'All' ? activeCategory : undefined,
          undefined
        );
        if (!cancelled) {
          if (data && data.length > 0) {
            setResources(data.map(toDisplayResource));
          } else {
            setResources(FALLBACK_RESOURCES);
          }
        }
      } catch {
        if (!cancelled) setResources(FALLBACK_RESOURCES);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchResources();
    return () => { cancelled = true; };
  }, [activeCategory, activeType]);

  const filtered = resources.filter((r) => {
    if (activeCategory !== 'All' && r.category !== activeCategory) return false;
    if (activeType !== 'All' && r.type !== activeType) return false;
    return true;
  });

  const toggleSave = (id: string) => setSavedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handlePress = async (url: string) => {
    setOpeningUrl(url);
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => setOpeningUrl(null), 1000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-800 text-text-primary tracking-tight">Resources</h1>
        <p className="text-sm text-text-secondary mt-1">Curated learning materials to accelerate your growth</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {RESOURCE_CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${activeCategory === cat ? 'bg-primary-500 text-white' : 'bg-bg-surface border border-border-base text-text-secondary hover:border-primary-300'}`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {TYPE_FILTERS.map((type) => (
          <button key={type} onClick={() => setActiveType(type)} className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-colors ${activeType === type ? 'bg-primary-500 text-white' : 'bg-bg-elevated text-text-muted hover:text-text-secondary'}`}>
            {type}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((resource) => {
            const Icon = ICON_MAP[resource.icon] || BookOpen;
            const isBookmarked = savedIds.includes(resource.id);
            const isOpening = openingUrl === resource.url;
            return (
              <div key={resource.id} className="bg-bg-surface rounded-xl border border-border-base shadow-sm hover:shadow-md hover:border-primary-300 transition-all duration-200 overflow-hidden relative opacity-85">
                {isOpening && (
                  <div className="absolute inset-0 bg-bg-base/60 z-10 flex items-center justify-center">
                    <span className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                        {Icon && <Icon size={18} className="text-primary-500" />}
                      </div>
                      <div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${DIFFICULTY_COLORS[resource.difficulty]}`}>{resource.difficulty}</span>
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); toggleSave(resource.id); }} className={`p-1.5 rounded-lg transition-colors ${isBookmarked ? 'text-primary-500 bg-primary-50' : 'text-text-muted hover:text-text-secondary'}`}>
                      <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                  <h3 className="text-sm font-bold font-display text-text-primary leading-snug">{resource.title}</h3>
                  <p className="text-xs text-text-muted">{resource.provider}</p>
                  <div className="flex items-center gap-3 text-xs text-text-secondary">
                    <span className="px-2 py-0.5 rounded-full bg-bg-elevated font-medium">{resource.category}</span>
                    <span>{resource.duration}</span>
                  </div>
                  <button onClick={() => handlePress(resource.url)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-primary-500 hover:text-primary-400">
                    <ExternalLink size={12} />
                    Start
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center py-16 gap-2">
          <Search size={32} className="text-text-muted" />
          <p className="text-sm font-bold text-text-primary">No resources found</p>
          <p className="text-xs text-text-muted">Try adjusting your filters</p>
        </div>
      )}
      <div className="h-10" />
    </div>
  );
}
