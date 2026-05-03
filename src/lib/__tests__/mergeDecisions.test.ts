import { mergeQuestProgress, mergeConstructionData } from '../mergeDecisions';
import { Project } from '../projectTypes';
import { ProgressData } from '../progressTypes';
import { ConstructionData, ConstructionStage } from '../constructionTypes';

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

// 辅助：创建进度数据
function makeProgress(overrides: Partial<ProgressData> = {}): ProgressData {
  return {
    current_stage: 'basic_info',
    budget: { total: null, allocated: 0 },
    timeline: { start: null, end: null },
    decisions: [],
    ...overrides,
  };
}

// 辅助：创建施工阶段
function makeStage(overrides: Partial<ConstructionStage> = {}): ConstructionStage {
  return {
    id: 'hydropower',
    label: '水电',
    status: 'in_progress',
    is_current: true,
    checklist: [],
    planned_cost: null,
    actual_cost: null,
    start_date: null,
    end_date: null,
    notes: null,
    ...overrides,
  };
}

// 辅助：创建施工数据
function makeConstruction(stages: ConstructionStage[] = [], budgetOverrides = {}): ConstructionData {
  return {
    mode: 'construction',
    overall_status: '施工中',
    budget: { planned_total: 100000, actual_total: 0, ...budgetOverrides },
    timeline: { start: '2025-01', expected_end: '2025-06' },
    stages,
  };
}

describe('mergeQuestProgress', () => {
  // □ 新增 decision → merged 结果包含新项，is_new = true
  it('新增 decision → is_new = true', () => {
    const project = makeProject();
    const progress = makeProgress({
      decisions: [
        { id: 'd1', category: '风格', label: '装修风格', value: '奶油风', status: 'confirmed', is_new: true, estimated_cost: 20000 },
      ],
    });
    const result = mergeQuestProgress(project, progress);
    expect(result.decisions).toHaveLength(1);
    expect(result.decisions![0].is_new).toBe(true);
    expect(result.decisions![0].value).toBe('奶油风');
  });

  // □ confirmed 决策更新 value → 覆盖旧值
  it('confirmed 更新 value → 覆盖旧值', () => {
    const project = makeProject({
      decisions: [
        { id: 'd1', category: '风格', label: '装修风格', value: '北欧', status: 'confirmed', is_new: false, estimated_cost: 15000 },
      ],
    });
    const progress = makeProgress({
      decisions: [
        { id: 'd1', category: '风格', label: '装修风格', value: '现代简约', status: 'confirmed', is_new: true, estimated_cost: 18000 },
      ],
    });
    const result = mergeQuestProgress(project, progress);
    expect(result.decisions).toHaveLength(1);
    expect(result.decisions![0].value).toBe('现代简约');
    expect(result.decisions![0].is_new).toBe(true);
  });

  // □ revisiting 状态 → 覆盖旧决策
  it('revisiting → 覆盖旧决策', () => {
    const project = makeProject({
      decisions: [
        { id: 'd1', category: '地板', label: '地板材质', value: '瓷砖', status: 'confirmed', is_new: false, estimated_cost: 10000 },
      ],
    });
    const progress = makeProgress({
      decisions: [
        { id: 'd1', category: '地板', label: '地板材质', value: '木地板', status: 'revisiting', is_new: true, estimated_cost: 12000 },
      ],
    });
    const result = mergeQuestProgress(project, progress);
    expect(result.decisions![0].value).toBe('木地板');
    expect(result.decisions![0].status).toBe('revisiting');
  });

  // □ pending + pending → is_new 保持 false
  it('pending + pending → is_new 保持 false', () => {
    const project = makeProject({
      decisions: [
        { id: 'd1', category: '风格', label: '装修风格', value: null, status: 'pending', is_new: false, estimated_cost: null },
      ],
    });
    const progress = makeProgress({
      decisions: [
        { id: 'd1', category: '风格', label: '装修风格', value: null, status: 'pending', is_new: true, estimated_cost: null },
      ],
    });
    const result = mergeQuestProgress(project, progress);
    expect(result.decisions![0].is_new).toBe(false);
  });

  // □ allocated 自动计算 = confirmed 项 estimated_cost 之和
  it('allocated = confirmed 项 estimated_cost 之和', () => {
    const project = makeProject();
    const progress = makeProgress({
      decisions: [
        { id: 'd1', category: '风格', label: '装修风格', value: '奶油风', status: 'confirmed', is_new: true, estimated_cost: 20000 },
        { id: 'd2', category: '地板', label: '地板材质', value: '瓷砖', status: 'confirmed', is_new: true, estimated_cost: 15000 },
        { id: 'd3', category: '窗帘', label: '窗帘', value: null, status: 'pending', is_new: true, estimated_cost: 5000 },
      ],
    });
    const result = mergeQuestProgress(project, progress);
    expect(result.budget!.allocated).toBe(35000); // 20000+15000, pending 不算
  });

  // □ budget.total 以 progress 为准，为 null 时保留 project 原值
  it('budget.total 以 progress 为准，null 时保留原值', () => {
    const project = makeProject({ budget: { total: 150000, allocated: 0 } });

    // progress 有值 → 用 progress 的
    const progress1 = makeProgress({ budget: { total: 200000, allocated: 0 } });
    const result1 = mergeQuestProgress(project, progress1);
    expect(result1.budget!.total).toBe(200000);

    // progress 为 null → 保留 project 的
    const progress2 = makeProgress({ budget: { total: null, allocated: 0 } });
    const result2 = mergeQuestProgress(project, progress2);
    expect(result2.budget!.total).toBe(150000);
  });
});

describe('mergeConstructionData', () => {
  // □ 首次 merge，stages 为空 → 不写入 constructionData（返回只含 updatedAt）
  it('首次 merge，stages 为空 → 不写入 constructionData', () => {
    const project = makeProject({ constructionData: null });
    const newData = makeConstruction([]);
    const result = mergeConstructionData(project, newData);
    expect(result.constructionData).toBeUndefined();
    expect(result.updatedAt).toBeDefined();
  });

  // □ 首次 merge，stages 非空 → 正常写入
  it('首次 merge，stages 非空 → 正常写入', () => {
    const project = makeProject({ constructionData: null });
    const stage = makeStage({ id: 'hydropower', label: '水电' });
    const newData = makeConstruction([stage]);
    const result = mergeConstructionData(project, newData);
    expect(result.constructionData).toBeDefined();
    expect(result.constructionData!.stages).toHaveLength(1);
    expect(result.constructionData!.stages[0].id).toBe('hydropower');
  });

  // □ 二次 merge，新 stages 为空 → 保留已有 stages
  it('二次 merge，新 stages 为空 → 保留已有 stages', () => {
    const existingStage = makeStage({ id: 'tiling', label: '瓦工', status: 'completed' });
    const project = makeProject({
      constructionData: makeConstruction([existingStage]),
    });
    const newData = makeConstruction([], { actual_total: 0 });
    const result = mergeConstructionData(project, newData);
    expect(result.constructionData!.stages).toHaveLength(1);
    expect(result.constructionData!.stages[0].id).toBe('tiling');
  });

  // □ 二次 merge，新 stages 有内容 → Map 合并，不重复
  it('二次 merge，新 stages 有内容 → Map 合并不重复', () => {
    const existingStage = makeStage({ id: 'hydropower', label: '水电', status: 'completed' });
    const project = makeProject({
      constructionData: makeConstruction([existingStage]),
    });
    const updatedStage = makeStage({ id: 'hydropower', label: '水电', status: 'inspecting' });
    const newStage = makeStage({ id: 'waterproof', label: '防水', status: 'in_progress' });
    const newData = makeConstruction([updatedStage, newStage]);
    const result = mergeConstructionData(project, newData);
    // hydropower 被更新，waterproof 新增 → 共2个
    expect(result.constructionData!.stages).toHaveLength(2);
    const hp = result.constructionData!.stages.find(s => s.id === 'hydropower');
    expect(hp!.status).toBe('inspecting');
  });

  // □ budget.actual_total 取 max，planned_total 优先用新值
  it('budget: actual_total 取 max, planned_total 优先新值', () => {
    const project = makeProject({
      constructionData: makeConstruction([makeStage()], { planned_total: 80000, actual_total: 30000 }),
    });
    const newData = makeConstruction([makeStage()], { planned_total: 120000, actual_total: 20000 });
    const result = mergeConstructionData(project, newData);
    expect(result.constructionData!.budget.planned_total).toBe(120000); // 新值
    expect(result.constructionData!.budget.actual_total).toBe(30000); // max(20000, 30000)
  });
});
