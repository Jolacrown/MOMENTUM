/**
 * Recommendations Service.
 * Provides personalized learning resources and mentors.
 * Per architecture.md and AGENTS.md.
 */

export interface Recommendation {
  id: string;
  type: 'mentor' | 'course' | 'workshop' | 'resource';
  title: string;
  subtitle: string;
  url: string;
  tags: string[];
}

const MOCK_RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'rec_1',
    type: 'mentor',
    title: 'Bankole Williams',
    subtitle: 'Career Coach & Performance Consultant (Lagos)',
    url: 'https://bankolewilliams.com/',
    tags: ['career', 'nigeria', 'mentorship'],
  },
  {
    id: 'rec_2',
    type: 'course',
    title: 'Google UX Design Professional Certificate',
    subtitle: '7-course series on Coursera',
    url: 'https://www.coursera.org/professional-certificates/google-ux-design',
    tags: ['design', 'ux', 'certificate'],
  },
  {
    id: 'rec_3',
    type: 'resource',
    title: 'Design Nigeria Slack Community',
    subtitle: 'Network with 5,000+ Nigerian designers',
    url: 'https://designnigeria.com/',
    tags: ['community', 'nigeria', 'design'],
  },
];

export const getRecommendations = async (): Promise<Recommendation[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  return MOCK_RECOMMENDATIONS;
};
