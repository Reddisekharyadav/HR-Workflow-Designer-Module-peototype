import WorkflowNodeBase, { type WorkflowNodeProps } from './WorkflowNodeBase';
import type { WorkflowNodeData } from '../../types/workflow';

const StartNode = (props: WorkflowNodeProps) => {
  const data = props.data as WorkflowNodeData;
  const title = data.type === 'start' ? data.startTitle : 'Start';

  return <WorkflowNodeBase {...props} title="Start" subtitle={title} />;
};

export default StartNode;
