import { AUTOMATIONS } from './mockData';
import { validateWorkflowGraph } from '../utils/graphValidation';
import {
  getNodeLabel,
  type AutomationDefinition,
  type SerializedWorkflow,
  type SimulationResponse,
} from '../types/workflow';

const NETWORK_LATENCY_MS = 450;

const delay = async (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const getAutomations = async (): Promise<AutomationDefinition[]> => {
  await delay(NETWORK_LATENCY_MS);
  return AUTOMATIONS;
};

const topologicalSort = (workflow: SerializedWorkflow): string[] => {
  const inDegree = new Map<string, number>();
  const graph = new Map<string, string[]>();

  workflow.nodes.forEach((node) => {
    inDegree.set(node.id, 0);
    graph.set(node.id, []);
  });

  workflow.edges.forEach((edge) => {
    graph.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  });

  const queue = Array.from(inDegree.entries())
    .filter(([, degree]) => degree === 0)
    .map(([id]) => id);

  const ordered: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current) {
      continue;
    }

    ordered.push(current);

    for (const next of graph.get(current) ?? []) {
      const nextDegree = (inDegree.get(next) ?? 0) - 1;
      inDegree.set(next, nextDegree);

      if (nextDegree === 0) {
        queue.push(next);
      }
    }
  }

  return ordered;
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

  const nodeMap = new Map(workflow.nodes.map((node) => [node.id, node]));
  const orderedIds = topologicalSort(workflow);

  const steps = orderedIds
    .map((id) => nodeMap.get(id))
    .filter((node): node is NonNullable<typeof node> => Boolean(node))
    .map((node, index) => ({
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
