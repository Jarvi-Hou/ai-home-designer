export interface Decision {
  id: string;
  category: string;
  label: string;
  value: string | null;
  status: 'confirmed' | 'revisiting' | 'pending';
  is_new: boolean;
  estimated_cost: number | null;
}

export interface ProgressData {
  current_stage: string;
  budget: {
    total: number | null;
    allocated: number;
  };
  timeline: {
    start: string | null;
    end: string | null;
  };
  decisions: Decision[];
}
