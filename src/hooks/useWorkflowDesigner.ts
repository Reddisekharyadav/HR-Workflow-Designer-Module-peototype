import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from '@xyflow/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createDefaultNodeData,
  type SerializedWorkflow,
  type WorkflowEdge,
  type WorkflowNode,
  type WorkflowNodeType,
} from '../types/workflow';
import { validateWorkflowGraph } from '../utils/graphValidation';

const STORAGE_KEY = 'hr-workflow-draft-v1';
const MAX_HISTORY = 50;

let nodeCounter = 1;

const buildId = (type: WorkflowNodeType) => `${type}_${nodeCounter++}`;

const syncNodeCounter = (nodes: WorkflowNode[]) => {
  const maxId = nodes.reduce((max, node) => {
    const match = node.id.match(/_(\d+)$/);
    const value = match ? Number(match[1]) : 0;
    return Math.max(max, Number.isFinite(value) ? value : 0);
  }, 0);

  nodeCounter = Math.max(nodeCounter, maxId + 1);
};

const cloneWorkflow = (workflow: SerializedWorkflow): SerializedWorkflow => {
  if (typeof structuredClone === 'function') {
    return structuredClone(workflow);
  }

  return JSON.parse(JSON.stringify(workflow)) as SerializedWorkflow;
};

const autoLayoutWorkflow = (workflow: SerializedWorkflow): SerializedWorkflow => {
  const inDegree = new Map<string, number>();
  const children = new Map<string, string[]>();

  workflow.nodes.forEach((node) => {
    inDegree.set(node.id, 0);
    children.set(node.id, []);
  });

  workflow.edges.forEach((edge) => {
    children.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  });

  const queue = Array.from(inDegree.entries())
    .filter(([, value]) => value === 0)
    .map(([id]) => id);

  const levels = new Map<string, number>();
  queue.forEach((id) => levels.set(id, 0));

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current) {
      continue;
    }

    const currentLevel = levels.get(current) ?? 0;

    for (const target of children.get(current) ?? []) {
      const nextLevel = Math.max(levels.get(target) ?? 0, currentLevel + 1);
      levels.set(target, nextLevel);
      inDegree.set(target, (inDegree.get(target) ?? 0) - 1);

      if ((inDegree.get(target) ?? 0) === 0) {
        queue.push(target);
      }
    }
  }

  const laneCount = new Map<number, number>();

  const nodes = workflow.nodes.map((node) => {
    const level = levels.get(node.id) ?? 0;
    const lane = laneCount.get(level) ?? 0;
    laneCount.set(level, lane + 1);

    return {
      ...node,
      position: {
        x: 130 + level * 280,
        y: 100 + lane * 150,
      },
    };
  });

  return {
    nodes,
    edges: workflow.edges,
  };
};

export const useWorkflowDesigner = () => {
  const [workflow, setWorkflow] = useState<SerializedWorkflow>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        return { nodes: [], edges: [] };
      }

      const parsed = JSON.parse(raw) as SerializedWorkflow;

      if (Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
        syncNodeCounter(parsed.nodes);
        return parsed;
      }

      return { nodes: [], edges: [] };
    } catch {
      return { nodes: [], edges: [] };
    }
  });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [history, setHistory] = useState<SerializedWorkflow[]>([]);
  const [future, setFuture] = useState<SerializedWorkflow[]>([]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workflow));
  }, [workflow]);

  const mutateWorkflow = useCallback((updater: (current: SerializedWorkflow) => SerializedWorkflow) => {
    setWorkflow((current) => {
      setHistory((previous) => [...previous, cloneWorkflow(current)].slice(-MAX_HISTORY));
      setFuture([]);
      const next = updater(current);
      syncNodeCounter(next.nodes);
      return next;
    });
  }, []);

  const onNodesChange = useCallback(
    (changes: NodeChange<WorkflowNode>[]) => {
      mutateWorkflow((current) => ({
        ...current,
        nodes: applyNodeChanges(changes, current.nodes),
      }));
    },
    [mutateWorkflow],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<WorkflowEdge>[]) => {
      mutateWorkflow((current) => ({
        ...current,
        edges: applyEdgeChanges(changes, current.edges),
      }));
    },
    [mutateWorkflow],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      mutateWorkflow((current) => ({
        ...current,
        edges: addEdge(
          {
            ...connection,
            animated: false,
            label: 'always',
            data: { condition: 'always' },
            id: `${connection.source}-${connection.target}-${Date.now()}`,
          },
          current.edges,
        ),
      }));
    },
    [mutateWorkflow],
  );

  const addNode = useCallback(
    (type: WorkflowNodeType, x: number, y: number) => {
      const id = buildId(type);

      const newNode: WorkflowNode = {
        id,
        type,
        position: { x, y },
        data: createDefaultNodeData(type),
      };

      mutateWorkflow((current) => ({
        ...current,
        nodes: [...current.nodes, newNode],
      }));
      setSelectedNodeId(id);
    },
    [mutateWorkflow],
  );

  const loadWorkflow = useCallback(
    (nextWorkflow: SerializedWorkflow) => {
      mutateWorkflow(() => nextWorkflow);
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
    },
    [mutateWorkflow],
  );

  const selectedNode = useMemo(
    () => workflow.nodes.find((node) => node.id === selectedNodeId) ?? null,
    [workflow.nodes, selectedNodeId],
  );

  const selectedEdge = useMemo(
    () => workflow.edges.find((edge) => edge.id === selectedEdgeId) ?? null,
    [workflow.edges, selectedEdgeId],
  );

  const updateNodeData = useCallback(
    (nodeId: string, updater: (node: WorkflowNode) => WorkflowNode) => {
      mutateWorkflow((current) => ({
        ...current,
        nodes: current.nodes.map((node) => (node.id === nodeId ? updater(node) : node)),
      }));
    },
    [mutateWorkflow],
  );

  const updateEdgeCondition = useCallback(
    (edgeId: string, condition: string) => {
      mutateWorkflow((current) => ({
        ...current,
        edges: current.edges.map((edge) =>
          edge.id === edgeId
            ? {
                ...edge,
                label: condition || 'always',
                data: {
                  ...(edge.data ?? {}),
                  condition: condition || 'always',
                },
              }
            : edge,
        ),
      }));
    },
    [mutateWorkflow],
  );

  const undo = useCallback(() => {
    setHistory((previous) => {
      if (previous.length === 0) {
        return previous;
      }

      const snapshot = previous[previous.length - 1];
      setFuture((futureSnapshots) => [cloneWorkflow(workflow), ...futureSnapshots].slice(0, MAX_HISTORY));
      setWorkflow(cloneWorkflow(snapshot));

      return previous.slice(0, -1);
    });
  }, [workflow]);

  const redo = useCallback(() => {
    setFuture((futureSnapshots) => {
      if (futureSnapshots.length === 0) {
        return futureSnapshots;
      }

      const [snapshot, ...rest] = futureSnapshots;
      setHistory((previous) => [...previous, cloneWorkflow(workflow)].slice(-MAX_HISTORY));
      setWorkflow(cloneWorkflow(snapshot));

      return rest;
    });
  }, [workflow]);

  const autoLayout = useCallback(() => {
    mutateWorkflow((current) => autoLayoutWorkflow(current));
  }, [mutateWorkflow]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    mutateWorkflow(() => ({ nodes: [], edges: [] }));
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, [mutateWorkflow]);

  const nodes = workflow.nodes;
  const edges = workflow.edges;
  const serializedWorkflow: SerializedWorkflow = workflow;

  const validationIssues = useMemo(
    () => validateWorkflowGraph(serializedWorkflow),
    [serializedWorkflow],
  );

  return {
    nodes,
    edges,
    selectedNode,
    selectedEdge,
    selectedNodeId,
    selectedEdgeId,
    validationIssues,
    serializedWorkflow,
    canUndo: history.length > 0,
    canRedo: future.length > 0,
    setSelectedNodeId,
    setSelectedEdgeId,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    loadWorkflow,
    updateNodeData,
    updateEdgeCondition,
    undo,
    redo,
    autoLayout,
    clearDraft,
  };
};
