import { parseConstruction } from '../parseConstruction';

describe('parseConstruction', () => {
  // □ 正常 [CONSTRUCTION] 块 → 返回正确 construction 对象
  it('正常 [CONSTRUCTION] 块 → 返回正确 construction 对象', () => {
    const json = JSON.stringify({
      mode: 'construction',
      overall_status: '施工中',
      budget: { planned_total: 100000, actual_total: 25000 },
      timeline: { start: '2025-01-15', expected_end: '2025-06-30' },
      stages: [
        {
          id: 'hydropower', label: '水电', status: 'completed', is_current: false,
          checklist: [
            { id: 'c1', label: '电线穿管', passed: true, note: null },
            { id: 'c2', label: '水管打压', passed: null, note: null },
          ],
          planned_cost: 15000, actual_cost: 14500,
          start_date: '2025-01-15', end_date: '2025-02-01', notes: null,
        },
        {
          id: 'waterproof', label: '防水', status: 'in_progress', is_current: true,
          checklist: [],
          planned_cost: 8000, actual_cost: null,
          start_date: '2025-02-05', end_date: null, notes: null,
        },
      ],
    });
    const raw = `施工进度如下：[CONSTRUCTION]${json}[/CONSTRUCTION] 请查看。`;
    const result = parseConstruction(raw);
    expect(result.construction).not.toBeNull();
    expect(result.construction!.overall_status).toBe('施工中');
    expect(result.construction!.stages).toHaveLength(2);
    expect(result.construction!.stages[0].checklist[0].passed).toBe(true);
    expect(result.construction!.stages[0].checklist[1].passed).toBeNull();
    expect(result.displayContent).toBe('施工进度如下： 请查看。');
  });

  // □ 无标签 → construction 为 null
  it('无标签 → construction 为 null', () => {
    const result = parseConstruction('今天聊聊设计方案吧');
    expect(result.construction).toBeNull();
    expect(result.displayContent).toBe('今天聊聊设计方案吧');
  });

  // □ stages 为空数组 → construction.stages = []
  it('stages 为空数组 → construction.stages = []', () => {
    const json = JSON.stringify({
      mode: 'construction',
      overall_status: '未开始',
      budget: { planned_total: null, actual_total: 0 },
      timeline: { start: null, expected_end: null },
      stages: [],
    });
    const result = parseConstruction(`[CONSTRUCTION]${json}[/CONSTRUCTION]`);
    expect(result.construction).not.toBeNull();
    expect(result.construction!.stages).toEqual([]);
  });

  // □ checklist passed 为 null/true/false → 正确保留
  it('checklist passed 三种值正确保留', () => {
    const json = JSON.stringify({
      mode: 'construction',
      overall_status: '施工中',
      budget: { planned_total: 50000, actual_total: 0 },
      timeline: { start: '2025-01', expected_end: '2025-03' },
      stages: [{
        id: 'painting', label: '油漆', status: 'in_progress', is_current: true,
        checklist: [
          { id: 'c1', label: '底漆', passed: true, note: '已验收' },
          { id: 'c2', label: '面漆第一遍', passed: false, note: '有色差' },
          { id: 'c3', label: '面漆第二遍', passed: null, note: null },
        ],
        planned_cost: 5000, actual_cost: null,
        start_date: null, end_date: null, notes: null,
      }],
    });
    const result = parseConstruction(`[CONSTRUCTION]${json}[/CONSTRUCTION]`);
    const checklist = result.construction!.stages[0].checklist;
    expect(checklist[0].passed).toBe(true);
    expect(checklist[1].passed).toBe(false);
    expect(checklist[2].passed).toBeNull();
  });

  // □ displayContent 不含 [CONSTRUCTION] 原始文本
  it('displayContent 不含 [CONSTRUCTION] 标签和内容', () => {
    const json = '{"mode":"construction","overall_status":"ok","budget":{"planned_total":null,"actual_total":0},"timeline":{"start":null,"expected_end":null},"stages":[]}';
    const raw = `前面文本[CONSTRUCTION]${json}[/CONSTRUCTION]后面文本`;
    const result = parseConstruction(raw);
    expect(result.displayContent).toBe('前面文本后面文本');
    expect(result.displayContent).not.toContain('[CONSTRUCTION]');
    expect(result.displayContent).not.toContain(json);
  });
});
