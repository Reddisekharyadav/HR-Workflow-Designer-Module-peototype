import type {
  SerializedWorkflow,
  ValidationIssue,
  WorkflowNode,
  WorkflowNodeType,
} from '../types/workflow';

const getAdjacent = (workflow: SerializedWorkflow): Map<string, string[]> => {
  const adjacency = new Map<string, string[]>();

  workflow.nodes.forEach((node) => adjacency.set(node.id, []));

  workflow.edges.forEach((edge) => {
    if (!adjacency.has(edge.source)) {
      adjacency.set(edge.source, []);
    }

    adjacency.get(edge.source)?.push(edge.target);
  });

  return adjacency;
};

const hasCycle = (workflow: SerializedWorkflow): boolean => {
  const adjacency = getAdjacent(workflow);
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const dfs = (nodeId: string): boolean => {
    if (visiting.has(nodeId)) {
      return true;
    }

    if (visited.has(nodeId)) {
      return false;
    }

    visiting.add(nodeId);

    for (const nextNodeId of adjacency.get(nodeId) ?? []) {
      if (dfs(nextNodeId)) {
        return true;
      }
    }

    visiting.delete(nodeId);
    visited.add(nodeId);

    return false;
  };

  for (const node of workflow.nodes) {
    if (dfs(node.id)) {
      return true;
    }
  }

  return false;
};

const findRootNodes = (workflow: SerializedWorkflow): WorkflowNode[] => {
  const targets = new Set(workflow.edges.map((edge) => edge.target));
  return workflow.nodes.filter((node) => !targets.has(node.id));
};

const countNodeType = (nodes: WorkflowNode[], type: WorkflowNodeType): number =>
  nodes.filter((node) => node.data.type === type).length;

export const validateWorkflowGraph = (workflow: SerializedWorkflow): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const { nodes, edges } = workflow;

  if (nodes.length === 0) {
    issues.push({ level: 'error', message: 'Workflow has no nodes.' });
    return issues;
  }

  const startNodes = nodes.filter((node) => node.data.type === 'start');
  const endNodes = nodes.filter((node) => node.data.type === 'end');

  if (startNodes.length !== 1) {
    issues.push({
      level: 'error',
      message: 'Workflow must contain exactly one Start node.',
    });
  }

  if (endNodes.length === 0) {
    issues.push({
      level: 'error',
      message: 'Workflow must contain at least one End node.',
    });
  }

  if (countNodeType(nodes, 'start') > 0) {
    const roots = findRootNodes(workflow);
    const invalidRoots = roots.filter((node) => node.data.type !== 'start');

    if (invalidRoots.length > 0) {
      issues.push({
        level: 'error',
        message: 'Start node must be the first node in every path.',
        nodeId: invalidRoots[0].id,
      });
    }
  }

  const inCount = new Map<string, number>();
  const outCount = new Map<string, number>();

  nodes.forEach((node) => {
    inCount.set(node.id, 0);
    outCount.set(node.id, 0);
  });

  edges.forEach((edge) => {
    inCount.set(edge.target, (inCount.get(edge.target) ?? 0) + 1);
    outCount.set(edge.source, (outCount.get(edge.source) ?? 0) + 1);
  });

  nodes.forEach((node) => {
    const incoming = inCount.get(node.id) ?? 0;
    const outgoing = outCount.get(node.id) ?? 0;

    if (node.data.type === 'start' && incoming > 0) {
      issues.push({
        level: 'error',
        message: 'Start node cannot have incoming connections.',
        nodeId: node.id,
      });
    }

    if (node.data.type !== 'end' && outgoing === 0) {
      issues.push({
        level: 'warning',
        message: 'Node has no outgoing connection.',
        nodeId: node.id,
      });
    }

    if (node.data.type !== 'start' && incoming === 0) {
      issues.push({
        level: 'warning',
        message: 'Node has no incoming connection.',
        nodeId: node.id,
      });
    }
  });

  if (hasCycle(workflow)) {
    issues.push({
      level: 'error',
      message: 'Workflow contains a cycle. Remove cyclic connections before simulation.',
    });
  }

  return issues;
};
