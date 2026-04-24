import WorkflowNodeBase, { type WorkflowNodeProps } from './WorkflowNodeBase';
import type { WorkflowNodeData } from '../../types/workflow';

const TaskNode = (props: WorkflowNodeProps) => {
  const data = props.data as WorkflowNodeData;
  const subtitle = data.type === 'task' ? data.title : 'Task';

  return <WorkflowNodeBase {...props} title="Task" subtitle={subtitle} />;
};

export default TaskNode;
