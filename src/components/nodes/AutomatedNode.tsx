import WorkflowNodeBase, { type WorkflowNodeProps } from './WorkflowNodeBase';
import type { WorkflowNodeData } from '../../types/workflow';

const AutomatedNode = (props: WorkflowNodeProps) => {
  const data = props.data as WorkflowNodeData;
  const subtitle = data.type === 'automated' ? data.title : 'Automated Step';

  return <WorkflowNodeBase {...props} title="Automated" subtitle={subtitle} />;
};

export default AutomatedNode;
