import type { WorkflowNodeType } from '../../types/workflow';
import type { DragEvent } from 'react';

type PaletteItem = {
  type: WorkflowNodeType;
  label: string;
  description: string;
};

const ITEMS: PaletteItem[] = [
  { type: 'start', label: 'Start Node', description: 'Workflow entry point' },
  { type: 'task', label: 'Task Node', description: 'Human task step' },
  { type: 'approval', label: 'Approval Node', description: 'Role based approval' },
  { type: 'automated', label: 'Automated Step', description: 'System action from API' },
  { type: 'end', label: 'End Node', description: 'Workflow completion' },
];

type NodePaletteProps = {
  onAddQuick: (type: WorkflowNodeType) => void;
  onToggle: () => void;
};

const NodePalette = ({ onAddQuick, onToggle }: NodePaletteProps) => {
  const onDragStart = (event: DragEvent<HTMLDivElement>, type: WorkflowNodeType) => {
    event.dataTransfer.setData('application/reactflow-node-type', type);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="panel palette-panel">
      <div className="panel-title-row">
        <h2>Node Palette</h2>
        <button type="button" className="icon-toggle" onClick={onToggle} aria-label="Hide node palette">
          {'<'}
        </button>
      </div>
      <p>Drag nodes into canvas or click Quick Add.</p>
      <div className="palette-list">
        {ITEMS.map((item) => (
          <div
            key={item.type}
            className="palette-item"
            draggable
            onDragStart={(event) => onDragStart(event, item.type)}
          >
            <div>
              <strong>{item.label}</strong>
              <span>{item.description}</span>
            </div>
            <button type="button" onClick={() => onAddQuick(item.type)}>
              Quick Add
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default NodePalette;
