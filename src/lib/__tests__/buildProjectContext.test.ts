import { buildProjectContext } from '../buildProjectContext';
import { Project } from '../projectTypes';

// 辅助：创建空项目
function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'p1',
    name: '测试项目',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    mode: 'quest',
    decisions: [],
    budget: { total: null, allocated: 0 },
    timeline: { start: null, end: null },
    currentStage: 'basic_info',
    constructionData: null,
    sessionIds: [],
    ...overrides,
  };
}

describe('buildProjectContext', () => {
  // □ 无 decisions 的项目 → 返回基本摘要
  it('无 decisions → 返回基本摘要', () => {
    const result = buildProjectContext(makeProject());
    expect(result).toContain('[已有项目信息]');
    expect(result).toContain('测试项目');
    expect(result).toContain('基本信息');
    expect(result).toContain('请基于以上已有信息继续对话');
  });

  // □ 有 confirmed decisions → 输出包含决策内容
  it('有 confirmed decisions → 输出包含决策内容', () => {
    const project = makeProject({
      decisions: [
        { id: 'd1', category: '风格', label: '装修风格', value: '奶油风', status: 'confirmed', is_new: false, estimated_cost: 20000 },
        { id: 'd2', category: '地板', label: '地板材质', value: null, status: 'pending', is_new: false, estimated_cost: null },
      ],
    });
    const result = buildProjectContext(project);
    expect(result).toContain('已确定决策');
    expect(result).toContain('装修风格');
    expect(result).toContain('奶油风');
    expect(result).toContain('待定项目');
    expect(result).toContain('地板材质');
  });

  // □ 有 budget.total → 输出包含预算信息
  it('有 budget.total → 输出包含预算信息', () => {
    const project = makeProject({
      budget: { total: 150000, allocated: 50000 },
    });
    const result = buildProjectContext(project);
    expect(result).toContain('15.0万');
    expect(result).toContain('5.0万');
  });

  // □ constructionData 不为 null → 输出包含施工阶段信息
  it('constructionData 不为 null → 输出包含施工阶段信息', () => {
    const project = makeProject({
      mode: 'construction',
      constructionData: {
        mode: 'construction',
        overall_status: '施工中',
        budget: { planned_total: 100000, actual_total: 30000 },
        timeline: { start: '2025-01', expected_end: '2025-06' },
        stages: [
          {
            id: 'hydropower', label: '水电', status: 'completed', is_current: false,
            checklist: [], planned_cost: 15000, actual_cost: 14000,
            start_date: '2025-01-15', end_date: '2025-02-01', notes: null,
          },
          {
            id: 'waterproof', label: '防水', status: 'in_progress', is_current: true,
            checklist: [], planned_cost: 8000, actual_cost: null,
            start_date: '2025-02-05', end_date: null, notes: null,
          },
          {
            id: 'tiling', label: '瓦工', status: 'issue', is_current: false,
            checklist: [], planned_cost: null, actual_cost: null,
            start_date: null, end_date: null, notes: '瓷砖空鼓率8%',
          },
        ],
      },
    });
    const result = buildProjectContext(project);
    expect(result).toContain('施工中');
    expect(result).toContain('10.0万');
    expect(result).toContain('已完成阶段');
    expect(result).toContain('水电');
    expect(result).toContain('当前阶段：防水');
    expect(result).toContain('存在问题');
    expect(result).toContain('瓦工');
    expect(result).toContain('瓷砖空鼓率8%');
  });

  // □ 输出长度不超过合理范围（避免撑爆 context）
  it('输出长度不超过合理范围', () => {
    // 构造大量 decisions
    const decisions = Array.from({ length: 50 }, (_, i) => ({
      id: `d${i}`,
      category: `cat${i}`,
      label: `label${i}`,
      value: `value${i}`,
      status: 'confirmed' as const,
      is_new: false,
      estimated_cost: 1000,
    }));
    const project = makeProject({ decisions, budget: { total: 200000, allocated: 50000 } });
    const result = buildProjectContext(project);
    // 50条决策不应超过 5000 字符
    expect(result.length).toBeLessThan(5000);
  });
});
