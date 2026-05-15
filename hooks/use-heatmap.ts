import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, NetworkError } from '@/services/apiClient';
import { ENDPOINTS } from '@/constants/api';

export type SectorKey = 'all' | 'trade' | 'transport' | 'services' | 'construction';
export type TimeKey   = 'today' | '7d' | '30d' | '3m';

export interface StateCell {
  id: string;
  label: string;
  row: number;
  col: number;
  base: Record<SectorKey, number>;
}

const GRID_CELLS: StateCell[] = [
  { id: 'sokoto',    label: 'Sokoto',     row: 0, col: 2, base: { all: 45, trade: 40, transport: 50, services: 35, construction: 30 } },
  { id: 'kebbi',     label: 'Kebbi',      row: 0, col: 3, base: { all: 35, trade: 30, transport: 40, services: 25, construction: 20 } },
  { id: 'katsina',   label: 'Katsina',    row: 0, col: 5, base: { all: 50, trade: 55, transport: 45, services: 30, construction: 25 } },
  { id: 'kano',      label: 'Kano',       row: 0, col: 6, base: { all: 85, trade: 90, transport: 80, services: 60, construction: 70 } },
  { id: 'jigawa',    label: 'Jigawa',     row: 0, col: 7, base: { all: 40, trade: 45, transport: 35, services: 25, construction: 20 } },
  { id: 'zamfara',   label: 'Zamfara',    row: 1, col: 4, base: { all: 30, trade: 25, transport: 35, services: 20, construction: 15 } },
  { id: 'borno',     label: 'Borno',      row: 1, col: 8, base: { all: 25, trade: 20, transport: 30, services: 15, construction: 10 } },
  { id: 'niger',     label: 'Niger',      row: 2, col: 1, base: { all: 55, trade: 50, transport: 65, services: 40, construction: 45 } },
  { id: 'kaduna',    label: 'Kaduna',     row: 2, col: 2, base: { all: 75, trade: 70, transport: 85, services: 65, construction: 60 } },
  { id: 'bauchi',    label: 'Bauchi',     row: 2, col: 6, base: { all: 45, trade: 40, transport: 45, services: 35, construction: 30 } },
  { id: 'gombe',     label: 'Gombe',      row: 2, col: 7, base: { all: 40, trade: 35, transport: 40, services: 30, construction: 25 } },
  { id: 'yobe',      label: 'Yobe',       row: 2, col: 8, base: { all: 20, trade: 15, transport: 25, services: 10, construction: 5 } },
  { id: 'fct',       label: 'Abuja',      row: 3, col: 2, base: { all: 80, trade: 65, transport: 60, services: 95, construction: 85 } },
  { id: 'nasarawa',  label: 'Nasarawa',   row: 3, col: 3, base: { all: 60, trade: 55, transport: 50, services: 65, construction: 70 } },
  { id: 'plateau',   label: 'Plateau',    row: 3, col: 4, base: { all: 55, trade: 50, transport: 45, services: 60, construction: 40 } },
  { id: 'taraba',    label: 'Taraba',     row: 3, col: 5, base: { all: 35, trade: 30, transport: 40, services: 25, construction: 20 } },
  { id: 'adamawa',   label: 'Adamawa',    row: 3, col: 8, base: { all: 30, trade: 25, transport: 35, services: 20, construction: 15 } },
  { id: 'kwara',     label: 'Kwara',      row: 4, col: 0, base: { all: 50, trade: 55, transport: 50, services: 45, construction: 35 } },
  { id: 'kogi',      label: 'Kogi',       row: 4, col: 2, base: { all: 60, trade: 55, transport: 75, services: 40, construction: 50 } },
  { id: 'benue',     label: 'Benue',      row: 4, col: 4, base: { all: 45, trade: 60, transport: 40, services: 30, construction: 25 } },
  { id: 'oyo',       label: 'Oyo',        row: 5, col: 0, base: { all: 75, trade: 80, transport: 75, services: 70, construction: 65 } },
  { id: 'osun',      label: 'Osun',       row: 5, col: 1, base: { all: 55, trade: 60, transport: 50, services: 55, construction: 45 } },
  { id: 'ekiti',     label: 'Ekiti',      row: 5, col: 2, base: { all: 45, trade: 50, transport: 40, services: 45, construction: 35 } },
  { id: 'ondo',      label: 'Ondo',       row: 5, col: 3, base: { all: 60, trade: 65, transport: 60, services: 55, construction: 50 } },
  { id: 'anambra',   label: 'Anambra',    row: 5, col: 5, base: { all: 80, trade: 95, transport: 85, services: 65, construction: 70 } },
  { id: 'enugu',     label: 'Enugu',      row: 5, col: 6, base: { all: 70, trade: 75, transport: 70, services: 80, construction: 60 } },
  { id: 'ebonyi',    label: 'Ebonyi',     row: 5, col: 7, base: { all: 40, trade: 45, transport: 35, services: 30, construction: 45 } },
  { id: 'crossriver',label: 'Cross River',row: 5, col: 8, base: { all: 50, trade: 45, transport: 50, services: 60, construction: 40 } },
  { id: 'lagos',     label: 'Lagos',      row: 6, col: 0, base: { all: 98, trade: 95, transport: 99, services: 92, construction: 88 } },
  { id: 'ogun',      label: 'Ogun',       row: 6, col: 1, base: { all: 85, trade: 80, transport: 90, services: 75, construction: 95 } },
  { id: 'delta',     label: 'Delta',      row: 6, col: 3, base: { all: 75, trade: 70, transport: 80, services: 65, construction: 60 } },
  { id: 'edo',       label: 'Edo',        row: 6, col: 4, base: { all: 65, trade: 70, transport: 65, services: 60, construction: 55 } },
  { id: 'imo',       label: 'Imo',        row: 6, col: 5, base: { all: 60, trade: 65, transport: 60, services: 55, construction: 45 } },
  { id: 'abia',      label: 'Abia',       row: 6, col: 6, base: { all: 70, trade: 85, transport: 75, services: 55, construction: 50 } },
  { id: 'akwaibom',  label: 'Akwa Ibom',  row: 6, col: 7, base: { all: 60, trade: 55, transport: 60, services: 65, construction: 55 } },
  { id: 'bayelsa',   label: 'Bayelsa',    row: 7, col: 3, base: { all: 40, trade: 35, transport: 50, services: 30, construction: 25 } },
  { id: 'rivers',    label: 'Rivers',     row: 7, col: 4, base: { all: 85, trade: 80, transport: 90, services: 85, construction: 80 } },
];

const TIME_MULT: Record<TimeKey, number> = { today: 0.75, '7d': 0.88, '30d': 1.0, '3m': 1.12 };

export function useHeatmap() {
  const [sector, setSector]     = useState<SectorKey>('all');
  const [period, setPeriod]     = useState<TimeKey>('30d');
  const [loading, setLoading]   = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  const activities = useMemo(() => {
    const mult = TIME_MULT[period];
    const out: Record<string, number> = {};
    GRID_CELLS.forEach((c) => {
      out[c.id] = Math.min(100, Math.round(c.base[sector] * mult));
    });
    return out;
  }, [sector, period]);

  const hotIds = useMemo(() => {
    return [...GRID_CELLS]
      .sort((a, b) => (activities[b.id] ?? 0) - (activities[a.id] ?? 0))
      .slice(0, 3)
      .map((c) => c.id);
  }, [activities]);

  return { sector, setSector, period, setPeriod, activities, hotIds, gridCells: GRID_CELLS, loading: false, isOffline: true };
}
