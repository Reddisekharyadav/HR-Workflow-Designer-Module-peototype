import { AUTOMATIONS } from './mockData';
import { validateWorkflowGraph } from '../utils/graphValidation';
import {
  getNodeLabel,
  type AutomationDefinition,
  type SerializedWorkflow,
  type SimulationResponse,
  type WorkflowNode,
} from '../types/workflow';

const NETWORK_LATENCY_MS = 450;
const DRAFT_STORAGE_KEY = 'hr-workflow-backend-draft-v1';

type SimulationContext = {
  leaveDays?: number;
  department?: string;
};

const delay = async (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const getAutomations = async (): Promise<AutomationDefinition[]> => {
  await delay(NETWORK_LATENCY_MS);
  return AUTOMATIONS;
};

const parseStartContext = (nodes: WorkflowNode[]): SimulationContext => {
  const start = nodes.find((node) => node.data.type === 'start');

  if (!start || start.data.type !== 'start') {
    return {};
  }

  const values = Object.fromEntries(start.data.metadata.map((item) => [item.key, item.value]));

  return {
    leaveDays: values.leaveDays ? Number(values.leaveDays) : undefined,
    department: values.department,
  };
};

const evaluateCondition = (condition: string | undefined, context: SimulationContext): boolean => {
  if (!condition || condition === 'always') {
    return true;
  }

  const normalized = condition.trim();

  const numericMatch = normalized.match(/^(leaveDays)\s*(<=|>=|<|>|==)\s*(\d+(?:\.\d+)?)$/i);

  if (numericMatch) {
    const value = context.leaveDays;

    if (value === undefined) {
      return false;
    }

    const [, , operator, rhsRaw] = numericMatch;
    const rhs = Number(rhsRaw);

    switch (operator) {
      case '<=':
        return value <= rhs;
      case '>=':
        return value >= rhs;
      case '<':
        return value < rhs;
      case '>':
        return value > rhs;
      case '==':
        return value === rhs;
      default:
        return false;
    }
  }

  const departmentMatch = normalized.match(/^department\s*==\s*(.+)$/i);

  if (departmentMatch) {
    const rhs = departmentMatch[1].trim().replace(/^"|"$/g, '');
    return (context.department ?? '').toLowerCase() === rhs.toLowerCase();
  }

  return false;
};

const traverseWithConditions = (workflow: SerializedWorkflow): WorkflowNode[] => {
  const nodeMap = new Map(workflow.nodes.map((node) => [node.id, node]));
  const outgoing = new Map<string, typeof workflow.edges>();

  workflow.nodes.forEach((node) => outgoing.set(node.id, []));
  workflow.edges.forEach((edge) => outgoing.get(edge.source)?.push(edge));

  const context = parseStartContext(workflow.nodes);
  const start = workflow.nodes.find((node) => node.data.type === 'start') ?? workflow.nodes[0];

  if (!start) {
    return [];
  }

  const visited = new Set<string>();
  const ordered: WorkflowNode[] = [];
  const queue: WorkflowNode[] = [start];

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current || visited.has(current.id)) {
      continue;
    }

    visited.add(current.id);
    ordered.push(current);

    const candidates = outgoing.get(current.id) ?? [];
    const conditioned = candidates.filter((edge) =>
      evaluateCondition(edge.data?.condition, context),
    );

    const selected = conditioned.length > 0 ? conditioned : candidates;

    selected.forEach((edge) => {
      const next = nodeMap.get(edge.target);

      if (next && !visited.has(next.id)) {
        queue.push(next);
      }
    });
  }

  workflow.nodes.forEach((node) => {
    if (!visited.has(node.id)) {
      ordered.push(node);
    }
  });

  return ordered;
};

export const saveWorkflowDraft = async (workflow: SerializedWorkflow): Promise<void> => {
  await delay(150);
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(workflow));
};

export const loadWorkflowDraft = async (): Promise<SerializedWorkflow | null> => {
  await delay(150);

  const raw = localStorage.getItem(DRAFT_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as SerializedWorkflow;
    return Array.isArray(parsed.nodes) && Array.isArray(parsed.edges) ? parsed : null;
  } catch {
    return null;
  }
};

export const simulateWorkflow = async (
  workflow: SerializedWorkflow,
): Promise<SimulationResponse> => {
  await delay(NETWORK_LATENCY_MS);

  const issues = validateWorkflowGraph(workflow);
  const blockingErrors = issues.filter((issue) => issue.level === 'error');

  if (blockingErrors.length > 0) {
    return {
      success: false,
      issues,
      steps: [],
    };
  }

  const orderedNodes = traverseWithConditions(workflow);
  const steps = orderedNodes.map((node, index) => ({
    nodeId: node.id,
    label: getNodeLabel(node),
    detail: `Executed ${node.data.type} step`,
    timestamp: `${index + 1}. ${new Date().toLocaleTimeString()}`,
  }));

  return {
    success: true,
    issues,
    steps,
  };
};
