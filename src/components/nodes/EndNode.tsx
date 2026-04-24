import WorkflowNodeBase, { type WorkflowNodeProps } from './WorkflowNodeBase';
import type { WorkflowNodeData } from '../../types/workflow';

const EndNode = (props: WorkflowNodeProps) => {
  const data = props.data as WorkflowNodeData;
  const subtitle = data.type === 'end' ? data.endMessage : 'End';

  return <WorkflowNodeBase {...props} title="End" subtitle={subtitle} />;
};

export default EndNode;
