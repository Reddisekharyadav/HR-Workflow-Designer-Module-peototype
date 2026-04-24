import WorkflowNodeBase, { type WorkflowNodeProps } from './WorkflowNodeBase';
import type { WorkflowNodeData } from '../../types/workflow';

const ApprovalNode = (props: WorkflowNodeProps) => {
  const data = props.data as WorkflowNodeData;
  const subtitle = data.type === 'approval' ? data.approverRole : 'Approval';

  return <WorkflowNodeBase {...props} title="Approval" subtitle={subtitle} />;
};

export default ApprovalNode;
