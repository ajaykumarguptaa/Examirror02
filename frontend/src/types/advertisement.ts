export type AdBadgeType = 'launch' | 'offer' | 'exam' | 'urgent';
export type AdLayoutType = 'splitCard' | 'fullBanner' | 'compactCard';
export type AdColorTheme = 'indigoBlue' | 'amberSunset' | 'emeraldTeal' | 'royalPurple' | 'cleanLight';

export interface AdSlideItem {
  id: string;
  title: string;
  subtitle: string;
  badgeText?: string;
  badgeType?: AdBadgeType;
  imageUrl?: string;
  layoutType?: AdLayoutType;
  colorTheme?: AdColorTheme;
  ctaText: string;
  ctaLink: string;
  secondaryText?: string;
  countdownEnabled?: boolean;
  countdownEndDate?: string;
}

export interface HomeAdvertisementSettings {
  enabled: boolean;
  autoSlideIntervalSeconds?: number;
  slides: AdSlideItem[];
  displayFormats: {
    popupModal: boolean;
    topRibbon: boolean;
    heroCard: boolean;
  };
  // Backward compatibility properties for single ad
  badgeText?: string;
  badgeType?: AdBadgeType;
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  ctaText?: string;
  ctaLink?: string;
  secondaryText?: string;
  countdownEnabled?: boolean;
  countdownEndDate?: string;
  popupDelaySeconds: number;
  showOncePerSession: boolean;
}

export const DEFAULT_AD_SLIDES: AdSlideItem[] = [
  {
    id: 'slide-1',
    title: 'Complete National Mock Test Series 2026',
    subtitle: 'Attempt live exam-pattern mock tests with All India Ranking (AIR), instant scorecards, and full bilingual solution explanations.',
    badgeText: 'NEW LAUNCH',
    badgeType: 'launch',
    layoutType: 'splitCard',
    colorTheme: 'indigoBlue',
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&auto=format&fit=crop&q=80',
    ctaText: 'Explore Test Series',
    ctaLink: '/test-series',
    secondaryText: 'Instant 1-Click Activation • Unlimited Practice',
    countdownEnabled: true,
    countdownEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'slide-2',
    title: 'Examirror Elite Pass — 365 Days Unlimited Access',
    subtitle: 'Unlock every single test series, upcoming exams, and comprehensive solutions for a full year with zero extra cost.',
    badgeText: 'BEST VALUE',
    badgeType: 'offer',
    layoutType: 'splitCard',
    colorTheme: 'amberSunset',
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&auto=format&fit=crop&q=80',
    ctaText: 'Get Elite Pass for ₹499',
    ctaLink: '/passes',
    secondaryText: 'Less than ₹1.4 / day • All Govt & Academic Exams',
    countdownEnabled: false
  }
];

export const DEFAULT_AD_SETTINGS: HomeAdvertisementSettings = {
  enabled: true,
  autoSlideIntervalSeconds: 5,
  slides: DEFAULT_AD_SLIDES,
  displayFormats: {
    popupModal: true,
    topRibbon: true,
    heroCard: true
  },
  badgeText: 'NEW BATCH & TEST SERIES LAUNCH',
  badgeType: 'launch',
  title: 'Complete National Mock Test Series 2026',
  subtitle: 'Attempt live exam-pattern mock tests with All India Ranking (AIR), instant scorecards, and full bilingual solution explanations.',
  imageUrl: '',
  ctaText: 'Explore & Enroll Now',
  ctaLink: '/test-series',
  secondaryText: 'Instant 1-Click Activation • Unlimited Practice Rounds',
  countdownEnabled: true,
  countdownEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  popupDelaySeconds: 1.5,
  showOncePerSession: true
};
