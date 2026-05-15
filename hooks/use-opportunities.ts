import { useCallback, useEffect, useState } from 'react';
import { api, NetworkError } from '@/services/apiClient';
import { ENDPOINTS } from '@/constants/api';

export interface Opportunity {
  id: string;
  title: string;
  company: string;
  location: string;
  category: string;
  pay: string;
  trustScoreRequired: number;
  postedAt: string;
  icon: string;
  description: string;
  tags: string[];
}

const MOCK_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'op1',
    title: 'Site Foreman (Construction)',
    company: 'BuildRight Ltd',
    location: 'Lekki, Lagos',
    category: 'Construction',
    pay: '₦120,000 / week',
    trustScoreRequired: 650,
    postedAt: new Date(Date.now() - 3600000).toISOString(),
    icon: '🏗',
    description: 'Lead a team of 10 workers for a commercial site. Requires consistent work history and high reliability.',
    tags: ['Leadership', 'Commercial', 'Safety'],
  },
  {
    id: 'op2',
    title: 'Experienced Dispatch Rider',
    company: 'QuickMove Logistics',
    location: 'Surulere, Lagos',
    category: 'Transport',
    pay: '₦45,000 / week + Bonus',
    trustScoreRequired: 400,
    postedAt: new Date(Date.now() - 7200000).toISOString(),
    icon: '🏍',
    description: 'Daily deliveries across Lagos Mainland. Clean driving record and punctuality are prioritized.',
    tags: ['Logistics', 'Delivery', 'Mainland'],
  },
  {
    id: 'op3',
    title: 'Hospitality Service Lead',
    company: 'Gold Coast Hotels',
    location: 'Victoria Island, Lagos',
    category: 'Services',
    pay: '₦15,000 / shift',
    trustScoreRequired: 550,
    postedAt: new Date(Date.now() - 86400000).toISOString(),
    icon: '🏨',
    description: 'Premium hospitality role. High community trust and work completion signals required.',
    tags: ['Premium', 'Customer Service', 'Hospitality'],
  },
  {
    id: 'op4',
    title: 'Market Supply Chain Assistant',
    company: 'Eko Trade Hub',
    location: 'Epe, Lagos',
    category: 'Trade',
    pay: '₦60,000 / week',
    trustScoreRequired: 300,
    postedAt: new Date(Date.now() - 172800000).toISOString(),
    icon: '🛒',
    description: 'Inventory management for a regional trade hub. Great entry-level role for consistent earners.',
    tags: ['Inventory', 'Trade', 'Supply Chain'],
  },
];

export function useOpportunities() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Opportunity[]>(ENDPOINTS.opportunities.list);
      setOpportunities(data);
      setIsOffline(false);
    } catch (err) {
      if (err instanceof NetworkError) {
        setOpportunities(MOCK_OPPORTUNITIES);
        setIsOffline(true);
      } else {
        // For Phase 1 demo, fallback to mock even on other errors
        setOpportunities(MOCK_OPPORTUNITIES);
        setIsOffline(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  return { opportunities, loading, error, isOffline, refetch: fetchOpportunities };
}
