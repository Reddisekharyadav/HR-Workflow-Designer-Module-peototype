import type { WorkflowEdge } from '../../types/workflow';

type EdgeConfigPanelProps = {
  edge: WorkflowEdge;
  onToggle: () => void;
  onUpdateCondition: (edgeId: string, condition: string) => void;
};

const PRESETS = ['always', 'leaveDays <= 2', 'leaveDays > 2', 'department == HR'];

const EdgeConfigPanel = ({ edge, onToggle, onUpdateCondition }: EdgeConfigPanelProps) => {
  const condition = edge.data?.condition ?? 'always';

  return (
    <aside className="panel config-panel">
      <div className="panel-title-row">
        <h2>Edge Configuration</h2>
        <button type="button" className="icon-toggle" onClick={onToggle} aria-label="Hide configuration panel">
          {'>'}
        </button>
      </div>
      <p>
        Editing edge <strong>{edge.id}</strong>
      </p>

      <div className="field-block">
        <label>Condition expression</label>
        <input
          value={condition}
          onChange={(event) => onUpdateCondition(edge.id, event.target.value)}
          placeholder="always or leaveDays <= 2"
        />
      </div>

      <div className="preset-row">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            className="secondary small"
            onClick={() => onUpdateCondition(edge.id, preset)}
          >
            {preset}
          </button>
        ))}
      </div>

      <p className="condition-help">
        Supports: <strong>always</strong>, <strong>leaveDays &lt;= number</strong>,{' '}
        <strong>leaveDays &gt; number</strong>, <strong>department == VALUE</strong>
      </p>
    </aside>
  );
};

export default EdgeConfigPanel;
