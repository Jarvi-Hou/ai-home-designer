export interface CheckItem {
  id: string;
  label: string;
  passed: boolean | null;
  note: string | null;
}

export interface ConstructionStage {
  id: string;
  label: string;
  status: 'not_started' | 'in_progress' | 'inspecting' | 'completed' | 'issue';
  is_current: boolean;
  checklist: CheckItem[];
  planned_cost: number | null;
  actual_cost: number | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
}

export interface ConstructionData {
  mode: 'construction';
  overall_status: string;
  budget: {
    planned_total: number | null;
    actual_total: number;
  };
  timeline: {
    start: string | null;
    expected_end: string | null;
  };
  stages: ConstructionStage[];
}

export const CONSTRUCTION_STAGES = [
  { id: 'demolition', label: '拆改' },
  { id: 'hydropower', label: '水电' },
  { id: 'waterproof', label: '防水' },
  { id: 'tiling', label: '瓦工' },
  { id: 'carpentry', label: '木工' },
  { id: 'painting', label: '油漆' },
  { id: 'installation', label: '安装' },
  { id: 'cleaning', label: '保洁' },
  { id: 'movein', label: '入住' },
];
