import { Project } from './projectTypes';

function formatMoney(n: number | null): string {
  if (n === null) return '待定';
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  return `${n}元`;
}

export function buildProjectContext(project: Project): string {
  const lines: string[] = ['[已有项目信息]', `项目：${project.name}`];

  if (project.mode === 'quest') {
    const stageLabels: Record<string, string> = {
      basic_info: '基本信息',
      renovation_mode: '装修模式',
      hard_decoration: '硬装方案',
      main_materials: '主材选择',
      soft_furnishing: '软装方向',
      appliances: '家电清单',
    };
    lines.push(`当前阶段：${stageLabels[project.currentStage] || project.currentStage}`);

    if (project.budget.total) {
      lines.push(
        `总预算：${formatMoney(project.budget.total)}（已分配 ${formatMoney(project.budget.allocated)}）`
      );
    }
    if (project.timeline.start || project.timeline.end) {
      lines.push(
        `时间线：${project.timeline.start || '待定'} → ${project.timeline.end || '待定'}`
      );
    }

    const confirmed = project.decisions.filter((d) => d.status === 'confirmed');
    const pending = project.decisions.filter((d) => d.status !== 'confirmed');

    if (confirmed.length > 0) {
      lines.push('', '已确定决策：');
      for (const d of confirmed) {
        const cost = d.estimated_cost !== null ? ` - 预估${formatMoney(d.estimated_cost)}` : '';
        lines.push(`- ${d.label}：${d.value || '—'} (${d.category})${cost}`);
      }
    }

    if (pending.length > 0) {
      lines.push('', '待定项目：');
      for (const d of pending) {
        lines.push(`- ${d.label} (${d.category})`);
      }
    }
  } else if (project.mode === 'construction' && project.constructionData) {
    const cd = project.constructionData;
    lines.push(`状态：${cd.overall_status}`);

    if (cd.budget.planned_total) {
      lines.push(
        `费用：计划 ${formatMoney(cd.budget.planned_total)}，已花费 ${formatMoney(cd.budget.actual_total)}`
      );
    }

    const completed = cd.stages.filter((s) => s.status === 'completed');
    const current = cd.stages.find((s) => s.is_current);
    const issues = cd.stages.filter((s) => s.status === 'issue');

    if (completed.length > 0) {
      lines.push('', '已完成阶段：');
      for (const s of completed) {
        const cost = s.actual_cost !== null ? ` - 实际${formatMoney(s.actual_cost)}` : '';
        lines.push(`- ${s.label}${cost}`);
      }
    }

    if (current) {
      lines.push(``, `当前阶段：${current.label}（${current.status === 'inspecting' ? '验收中' : '施工中'}）`);
    }

    if (issues.length > 0) {
      lines.push('', '存在问题：');
      for (const s of issues) {
        lines.push(`- ${s.label}：${s.notes || '待处理'}`);
      }
    }
  }

  lines.push('', '请基于以上已有信息继续对话，不要重复已确定的决策。');

  return lines.join('\n');
}
