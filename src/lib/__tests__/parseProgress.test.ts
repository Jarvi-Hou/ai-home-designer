import { parseProgress } from '../parseProgress';

describe('parseProgress', () => {
  // □ 正常 JSON → 返回正确 progress 对象
  it('正常 JSON → 返回正确 progress 对象', () => {
    const raw = `你好！[PROGRESS]{"current_stage":"basic_info","budget":{"total":150000,"allocated":50000},"timeline":{"start":"2025-01","end":"2025-06"},"decisions":[{"id":"d1","category":"风格","label":"装修风格","value":"奶油风","status":"confirmed","is_new":true,"estimated_cost":20000}]}[/PROGRESS] 咱们继续`;
    const result = parseProgress(raw);
    expect(result.progress).not.toBeNull();
    expect(result.progress!.current_stage).toBe('basic_info');
    expect(result.progress!.budget.total).toBe(150000);
    expect(result.progress!.budget.allocated).toBe(50000);
    expect(result.progress!.decisions).toHaveLength(1);
    expect(result.progress!.decisions[0].value).toBe('奶油风');
    expect(result.displayContent).toBe('你好！ 咱们继续');
  });

  // □ 无 [PROGRESS] 标签 → progress 为 null，displayContent 等于原文
  it('无 [PROGRESS] 标签 → progress 为 null，displayContent 等于原文', () => {
    const raw = '今天天气不错，我们来聊聊装修吧';
    const result = parseProgress(raw);
    expect(result.progress).toBeNull();
    expect(result.displayContent).toBe(raw);
  });

  // □ 有开始标签无结束标签 → progress 为 null，displayContent 截断到标签前
  it('有开始标签无结束标签 → progress 为 null，displayContent 截断到标签前', () => {
    const raw = '前面的文本[PROGRESS]{"current_stage":"basic_info"';
    const result = parseProgress(raw);
    expect(result.progress).toBeNull();
    expect(result.displayContent).toBe('前面的文本');
  });

  // □ JSON 有 trailing comma → 容错修复后仍能解析
  it('JSON 有 trailing comma → 容错修复后仍能解析', () => {
    const raw = `[PROGRESS]{"current_stage":"basic_info","budget":{"total":100000,"allocated":0,},"timeline":{"start":null,"end":null},"decisions":[],}[/PROGRESS]`;
    const result = parseProgress(raw);
    expect(result.progress).not.toBeNull();
    expect(result.progress!.current_stage).toBe('basic_info');
    expect(result.progress!.budget.total).toBe(100000);
    expect(result.progress!.decisions).toEqual([]);
  });

  // □ decisions 数组缺少字段（无 estimated_cost）→ 默认为 null，不报错
  it('decisions 缺少 estimated_cost → 默认为 null', () => {
    const raw = `[PROGRESS]{"current_stage":"basic_info","budget":{"total":null,"allocated":0},"timeline":{"start":null,"end":null},"decisions":[{"id":"d1","category":"风格","label":"装修风格","value":"北欧","status":"confirmed","is_new":true}]}[/PROGRESS]`;
    const result = parseProgress(raw);
    expect(result.progress).not.toBeNull();
    expect(result.progress!.decisions[0].estimated_cost).toBeNull();
  });

  // □ status 字段为非法值 → 强制为 'pending'
  it('status 为非法值 → 强制为 pending', () => {
    const raw = `[PROGRESS]{"current_stage":"basic_info","budget":{"total":null,"allocated":0},"timeline":{"start":null,"end":null},"decisions":[{"id":"d1","category":"风格","label":"装修风格","value":null,"status":"invalid_status","is_new":false,"estimated_cost":null}]}[/PROGRESS]`;
    const result = parseProgress(raw);
    expect(result.progress).not.toBeNull();
    expect(result.progress!.decisions[0].status).toBe('pending');
  });

  // □ 内容含 [PROGRESS] 标签的前后文本 → displayContent 正确去掉标签和 JSON
  it('前后文本正确拼接', () => {
    const before = '这是前面的聊天内容。';
    const after = ' 我们继续讨论吧！';
    const json = '{"current_stage":"main_materials","budget":{"total":200000,"allocated":80000},"timeline":{"start":"2025-03","end":"2025-09"},"decisions":[]}';
    const raw = `${before}[PROGRESS]${json}[/PROGRESS]${after}`;
    const result = parseProgress(raw);
    expect(result.displayContent).toBe(`${before}${after}`);
    expect(result.progress).not.toBeNull();
    expect(result.progress!.current_stage).toBe('main_materials');
  });
});
