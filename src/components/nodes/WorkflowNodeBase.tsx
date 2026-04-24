import { Handle, Position, type NodeProps } from '@xyflow/react';

type WorkflowNodeBaseProps = NodeProps & {
  title: string;
  subtitle: string;
};

const NodeBadges = ({ data }: { data: NodeProps['data'] }) => {
  const safeData = data as { uiIssues?: Array<{ level: 'error' | 'warning'; message: string }> };
  const issues = safeData.uiIssues ?? [];

  if (issues.length === 0) {
    return null;
  }

  return (
    <div className="node-badges">
      {issues.slice(0, 2).map((issue, index) => (
        <span key={`${issue.level}-${index}`} className={`node-badge ${issue.level}`} title={issue.message}>
          {issue.level === 'error' ? 'Error' : 'Warn'}
        </span>
      ))}
    </div>
  );
};

const WorkflowNodeBase = ({ title, subtitle, selected, data }: WorkflowNodeBaseProps) => (
  <div className={`node-card ${selected ? 'node-selected' : ''}`}>
    <Handle type="target" position={Position.Top} />
    <div className="node-title">{title}</div>
    <div className="node-subtitle">{subtitle}</div>
    <NodeBadges data={data} />
    <Handle type="source" position={Position.Bottom} />
  </div>
);

export default WorkflowNodeBase;

export type WorkflowNodeProps = NodeProps;
