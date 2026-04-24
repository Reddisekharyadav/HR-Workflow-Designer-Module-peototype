import { useMemo, useState } from 'react';
import { simulateWorkflow } from '../../api/workflowApi';
import type { SerializedWorkflow, SimulationResponse, ValidationIssue } from '../../types/workflow';

type SandboxPanelProps = {
  workflow: SerializedWorkflow;
  issues: ValidationIssue[];
};

const SandboxPanel = ({ workflow, issues }: SandboxPanelProps) => {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SimulationResponse | null>(null);
  const [showJson, setShowJson] = useState(false);

  const blockingErrors = useMemo(() => issues.filter((issue) => issue.level === 'error'), [issues]);

  const runSimulation = async () => {
    setRunning(true);

    try {
      const response = await simulateWorkflow(workflow);
      setResult(response);
    } finally {
      setRunning(false);
    }
  };

  return (
    <section className="panel sandbox-panel">
      <div className="sandbox-header">
        <div>
          <h2>Workflow Sandbox</h2>
          <p>Serialize, validate, and run a mock execution timeline.</p>
        </div>
        <button type="button" onClick={runSimulation} disabled={running}>
          {running ? 'Running...' : 'Run Simulation'}
        </button>
      </div>

      <div className="validation-block">
        <h3>Validation</h3>
        {issues.length === 0 ? (
          <p className="ok">No validation issues found.</p>
        ) : (
          <ul>
            {issues.map((issue, index) => (
              <li key={`${issue.message}-${index}`} className={issue.level === 'error' ? 'error' : 'warning'}>
                [{issue.level.toUpperCase()}] {issue.message}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="json-block">
        <button type="button" className="secondary" onClick={() => setShowJson((current) => !current)}>
          {showJson ? 'Hide Serialized JSON' : 'Show Serialized JSON'}
        </button>
        {showJson && <pre>{JSON.stringify(workflow, null, 2)}</pre>}
      </div>

      <div className="execution-block">
        <h3>Execution Log</h3>
        {result === null && <p>Run simulation to see step-by-step execution.</p>}
        {result && (
          <>
            {!result.success && blockingErrors.length > 0 && (
              <p className="error">Simulation blocked due to validation errors.</p>
            )}
            {result.success && result.steps.length === 0 && <p>No steps available for execution.</p>}
            {result.steps.length > 0 && (
              <ol>
                {result.steps.map((step) => (
                  <li key={`${step.nodeId}-${step.timestamp}`}>
                    <strong>{step.label}</strong> - {step.detail} ({step.timestamp})
                  </li>
                ))}
              </ol>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default SandboxPanel;
