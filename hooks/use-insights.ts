import { useCallback, useEffect, useState } from 'react';
import { useOnboardingStore } from '@/store/onboarding-store';
import { useTrustScore } from '@/hooks/use-trust-score';

export interface MarketPulseInsight {
  id: string;
  type: 'demand' | 'trust' | 'earning';
  title: string;
  description: string;
  icon: string;
  color: string;
  borderColor: string;
}

export interface AIAdvice {
  title: string;
  body: string;
  actionLabel: string;
  actionRoute: string;
}

export interface JobMatch {
  id: string;
  role: string;
  company: string;
  reason: string;
  fitScore: number;
  salary?: string;
  location: string;
}

export function useInsights() {
  const { skills, bvnVerified } = useOnboardingStore();
  const category = skills[0] || 'Artisans';
  const { score } = useTrustScore();
  
  const [pulse, setPulse] = useState<MarketPulseInsight[]>([]);
  const [advice, setAdvice] = useState<AIAdvice | null>(null);
  const [jobMatches, setJobMatches] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    
    // In a real app, this would hit /api/v1/market/pulse
    // For now, we generate "intelligent" local insights based on user data
    
    const marketPulse: MarketPulseInsight[] = [
      {
        id: '1',
        type: 'demand',
        title: `High Demand: ${category || 'Artisans'}`,
        description: `Demand for ${category || 'professionals'} in Lagos is up 15% today.`,
        icon: '📈',
        color: '#FFFDF0',
        borderColor: '#FDF0A0',
      },
      {
        id: '2',
        type: 'trust',
        title: 'Trust Multiplier',
        description: 'Users with 500+ score are seeing 2x job offers in your area.',
        icon: '🛡️',
        color: '#F0F9FF',
        borderColor: '#BAE6FD',
      },
      {
        id: '3',
        type: 'earning',
        title: 'Earning Surge',
        description: 'Average daily earnings for verified users hit ₦25,000 this week.',
        icon: '💰',
        color: '#F0FDF4',
        borderColor: '#BBF7D0',
      }
    ];

    // AI Coaching Logic (Polished for the pitch)
    let aiAdvice: AIAdvice;

    if (!bvnVerified) {
      aiAdvice = {
        title: 'Identity Gap Detected',
        body: "Your Trust Score is capped. Verifying your BVN via Squad will unlock an immediate +100 point boost and premium gig access.",
        actionLabel: 'VERIFY NOW',
        actionRoute: '/profile/edit',
      };
    } else if (score < 500) {
      aiAdvice = {
        title: 'Score Strategy',
        body: `You're close to 'Established' status. Complete 2 more verified transactions this week to hit the 500 mark.`,
        actionLabel: 'SEND PAYMENT LINK',
        actionRoute: '/(tabs)/wallet',
      };
    } else {
      aiAdvice = {
        title: 'Optimization Plan',
        body: `Your score is excellent. We've detected a surge in ${category || 'your field'} in Lekki Phase 1. Update your portfolio to target high-end clients.`,
        actionLabel: 'UPDATE PORTFOLIO',
        actionRoute: '/portfolio',
      };
    }

    // AI Job Matching Logic
    const matches: JobMatch[] = [
      {
        id: 'j1',
        role: `Lead ${category}`,
        company: 'Apex Infrastructure Ltd',
        reason: `Your skill in ${category} combined with your high Trust Score (820+) makes you a perfect fit for this supervision role.`,
        fitScore: 98,
        salary: '₦180,000 / Monthly',
        location: 'Victoria Island'
      },
      {
        id: 'j2',
        role: `Freelance ${category}`,
        company: 'Urban Builders',
        reason: 'They prioritize pros with verified transaction histories, which you currently excel in.',
        fitScore: 88,
        salary: '₦45,000 / Project',
        location: 'Ikeja'
      }
    ];

    setPulse(marketPulse);
    setAdvice(aiAdvice);
    setJobMatches(matches);
    setLoading(false);
  }, [category, bvnVerified, score]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return { pulse, advice, jobMatches, loading, refetch: fetchInsights };
}
