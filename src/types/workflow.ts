import type { Edge, Node } from '@xyflow/react';

export type WorkflowNodeType = 'start' | 'task' | 'approval' | 'automated' | 'end';

export type KeyValueField = {
  key: string;
  value: string;
};

export type AutomationDefinition = {
  id: string;
  label: string;
  params: string[];
};

export type StartNodeData = {
  type: 'start';
  startTitle: string;
  metadata: KeyValueField[];
};

export type TaskNodeData = {
  type: 'task';
  title: string;
  description: string;
  assignee: string;
  dueDate: string;
  customFields: KeyValueField[];
};

export type ApprovalNodeData = {
  type: 'approval';
  title: string;
  approverRole: string;
  autoApproveThreshold: number;
};

export type AutomatedStepNodeData = {
  type: 'automated';
  title: string;
  actionId: string;
  actionParams: Record<string, string>;
};

export type EndNodeData = {
  type: 'end';
  endMessage: string;
  summaryFlag: boolean;
};

export type WorkflowNodeData =
  | StartNodeData
  | TaskNodeData
  | ApprovalNodeData
  | AutomatedStepNodeData
  | EndNodeData;

export type WorkflowNode = Node<WorkflowNodeData>;
export type WorkflowEdge = Edge;

export type SerializedWorkflow = {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};

export type ValidationIssue = {
  level: 'error' | 'warning';
  message: string;
  nodeId?: string;
};

export type SimulationStep = {
  nodeId: string;
  label: string;
  detail: string;
  timestamp: string;
};

export type SimulationResponse = {
  success: boolean;
  issues: ValidationIssue[];
  steps: SimulationStep[];
};

export const createDefaultNodeData = (type: WorkflowNodeType): WorkflowNodeData => {
  switch (type) {
    case 'start':
      return {
        type: 'start',
        startTitle: 'New workflow entry',
        metadata: [],
      };
    case 'task':
      return {
        type: 'task',
        title: 'Collect documents',
        description: '',
        assignee: '',
        dueDate: '',
        customFields: [],
      };
    case 'approval':
      return {
        type: 'approval',
        title: 'Manager approval',
        approverRole: 'Manager',
        autoApproveThreshold: 0,
      };
    case 'automated':
      return {
        type: 'automated',
        title: 'Automation step',
        actionId: '',
        actionParams: {},
      };
    case 'end':
      return {
        type: 'end',
        endMessage: 'Workflow completed',
        summaryFlag: false,
      };
    default:
      return {
        type: 'task',
        title: 'Task',
        description: '',
        assignee: '',
        dueDate: '',
        customFields: [],
      };
  }
};

export const getNodeLabel = (node: WorkflowNode): string => {
  const data = node.data;

  switch (data.type) {
    case 'start':
      return data.startTitle || 'Start';
    case 'task':
      return data.title || 'Task';
    case 'approval':
      return data.title || 'Approval';
    case 'automated':
      return data.title || 'Automated Step';
    case 'end':
      return data.endMessage || 'End';
    default:
      return 'Step';
  }
};
