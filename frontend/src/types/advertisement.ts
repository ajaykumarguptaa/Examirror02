export type AdBadgeType = 'launch' | 'offer' | 'exam' | 'urgent';
export type AdLayoutType = 'pureImage' | 'fullBanner' | 'splitCard' | 'compactCard';
export type AdColorTheme = 'indigoBlue' | 'amberSunset' | 'emeraldTeal' | 'royalPurple' | 'cleanLight';
export type AdBannerPosition = 'top' | 'below_hero';
export type AdBannerWidth = 'full' | 'container';
export type AdBannerHeight = 'compact' | 'standard' | 'large' | 'auto';
export type AdImageFit = 'cover' | 'contain';

export interface AdSlideItem {
  id: string;
  title: string;
  subtitle: string;
  badgeText?: string;
  badgeType?: AdBadgeType;
  imageUrl?: string;
  imageFit?: AdImageFit;
  layoutType?: AdLayoutType;
  colorTheme?: AdColorTheme;
  ctaText: string;
  ctaLink: string;
  openInNewTab?: boolean;
  secondaryText?: string;
  countdownEnabled?: boolean;
  countdownEndDate?: string;
}

export interface HomeAdvertisementSettings {
  enabled: boolean;
  autoSlideIntervalSeconds?: number;
  bannerPosition?: AdBannerPosition; // 'top' (below marquee, above hero) | 'below_hero'
  bannerWidth?: AdBannerWidth; // 'full' (100vw edge to edge) | 'container' (max-w-7xl)
  bannerHeight?: AdBannerHeight; // 'compact' | 'standard' | 'large' | 'auto'
  bannerFit?: AdImageFit; // 'cover' | 'contain'
  showArrows?: boolean;
  showDots?: boolean;
  sliderTransition?: 'slide' | 'fade';
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
    layoutType: 'pureImage',
    colorTheme: 'indigoBlue',
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1600&auto=format&fit=crop&q=80',
    imageFit: 'cover',
    ctaText: 'Explore Test Series',
    ctaLink: '/test-series',
    openInNewTab: false,
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
    layoutType: 'pureImage',
    colorTheme: 'amberSunset',
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1600&auto=format&fit=crop&q=80',
    imageFit: 'cover',
    ctaText: 'Get Elite Pass for ₹299',
    ctaLink: '/passes',
    openInNewTab: false,
    secondaryText: 'Less than ₹1.4 / day • All Govt & Academic Exams',
    countdownEnabled: false
  }
];

export const DEFAULT_AD_SETTINGS: HomeAdvertisementSettings = {
  enabled: true,
  autoSlideIntervalSeconds: 5,
  bannerPosition: 'top',
  bannerWidth: 'full',
  bannerHeight: 'standard',
  bannerFit: 'cover',
  showArrows: true,
  showDots: true,
  sliderTransition: 'slide',
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
