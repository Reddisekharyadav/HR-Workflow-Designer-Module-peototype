import { Handle, Position, type NodeProps } from '@xyflow/react';

type WorkflowNodeBaseProps = NodeProps & {
  title: string;
  subtitle: string;
};

const WorkflowNodeBase = ({ title, subtitle, selected }: WorkflowNodeBaseProps) => (
  <div className={`node-card ${selected ? 'node-selected' : ''}`}>
    <Handle type="target" position={Position.Top} />
    <div className="node-title">{title}</div>
    <div className="node-subtitle">{subtitle}</div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

export default WorkflowNodeBase;

export type WorkflowNodeProps = NodeProps;
