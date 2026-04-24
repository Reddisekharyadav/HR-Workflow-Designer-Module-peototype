import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from '@xyflow/react';
import { useCallback, useMemo, useState } from 'react';
import {
  createDefaultNodeData,
  type SerializedWorkflow,
  type WorkflowEdge,
  type WorkflowNode,
  type WorkflowNodeType,
} from '../types/workflow';
import { validateWorkflowGraph } from '../utils/graphValidation';

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

export const useWorkflowDesigner = () => {
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const onNodesChange = useCallback((changes: NodeChange<WorkflowNode>[]) => {
    setNodes((current) => applyNodeChanges(changes, current));
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange<WorkflowEdge>[]) => {
    setEdges((current) => applyEdgeChanges(changes, current));
  }, []);

  const onConnect = useCallback((connection: Connection) => {
    setEdges((current) =>
      addEdge(
        {
          ...connection,
          animated: false,
          id: `${connection.source}-${connection.target}-${Date.now()}`,
        },
        current,
      ),
    );
  }, []);

  const addNode = useCallback((type: WorkflowNodeType, x: number, y: number) => {
    const id = buildId(type);

    const newNode: WorkflowNode = {
      id,
      type,
      position: { x, y },
      data: createDefaultNodeData(type),
    };

    setNodes((current) => [...current, newNode]);
    setSelectedNodeId(id);
  }, []);

  const loadWorkflow = useCallback((workflow: SerializedWorkflow) => {
    setNodes(workflow.nodes);
    setEdges(workflow.edges);
    setSelectedNodeId(null);
    syncNodeCounter(workflow.nodes);
  }, []);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );

  const updateNodeData = useCallback(
    (nodeId: string, updater: (node: WorkflowNode) => WorkflowNode) => {
      setNodes((current) => current.map((node) => (node.id === nodeId ? updater(node) : node)));
    },
    [],
  );

  const serializedWorkflow: SerializedWorkflow = useMemo(
    () => ({ nodes, edges }),
    [nodes, edges],
  );

  const validationIssues = useMemo(
    () => validateWorkflowGraph(serializedWorkflow),
    [serializedWorkflow],
  );

  return {
    nodes,
    edges,
    selectedNode,
    selectedNodeId,
    validationIssues,
    serializedWorkflow,
    setSelectedNodeId,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    loadWorkflow,
    updateNodeData,
  };
};
