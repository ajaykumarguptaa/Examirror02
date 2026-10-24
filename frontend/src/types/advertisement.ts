export interface HomeAdvertisementSettings {
  enabled: boolean;
  displayFormats: {
    popupModal: boolean;
    topRibbon: boolean;
    heroCard: boolean;
  };
  badgeText: string;
  badgeType: 'launch' | 'offer' | 'exam' | 'urgent';
  title: string;
  subtitle: string;
  imageUrl?: string;
  ctaText: string;
  ctaLink: string;
  secondaryText?: string;
  countdownEnabled: boolean;
  countdownEndDate?: string;
  popupDelaySeconds: number;
  showOncePerSession: boolean;
}

export const DEFAULT_AD_SETTINGS: HomeAdvertisementSettings = {
  enabled: true,
  displayFormats: {
    popupModal: true,
    topRibbon: true,
    heroCard: true
  },
  badgeText: '🚀 NEW BATCH & TEST SERIES LAUNCH',
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
