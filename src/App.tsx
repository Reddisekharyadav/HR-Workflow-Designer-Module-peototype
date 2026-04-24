import { useMemo, useRef, useState, type ChangeEvent, type DragEvent, type MouseEvent as ReactMouseEvent } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  type OnSelectionChangeParams,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import ApprovalNode from './components/nodes/ApprovalNode';
import AutomatedNode from './components/nodes/AutomatedNode';
import EndNode from './components/nodes/EndNode';
import StartNode from './components/nodes/StartNode';
import TaskNode from './components/nodes/TaskNode';
import AppSidebar from './components/panels/AppSidebar';
import EdgeConfigPanel from './components/panels/EdgeConfigPanel';
import NodeConfigPanel from './components/panels/NodeConfigPanel';
import NodePalette from './components/panels/NodePalette';
import SandboxPanel from './components/panels/SandboxPanel';
import { loadWorkflowDraft, saveWorkflowDraft } from './api/workflowApi';
import { useAutomations } from './hooks/useAutomations';
import { useWorkflowDesigner } from './hooks/useWorkflowDesigner';
import type { SerializedWorkflow, WorkflowEdge, WorkflowNode, WorkflowNodeType } from './types/workflow';

const INITIAL_QUICK_ADD_X = 160;
const QUICK_ADD_GAP = 48;

type SidebarSection =
  | 'dashboard'
  | 'compliance'
  | 'scheduler'
  | 'analytics'
  | 'integrations'
  | 'repository'
  | 'workflows'
  | 'settings'
  | 'support';

const DesignerApp = () => {
  const {
    nodes,
    edges,
    selectedNode,
    selectedEdge,
    setSelectedNodeId,
    setSelectedEdgeId,
    validationIssues,
    serializedWorkflow,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    loadWorkflow,
    updateNodeData,
    updateEdgeCondition,
    undo,
    redo,
    autoLayout,
    clearDraft,
    canUndo,
    canRedo,
  } = useWorkflowDesigner();

  const { automations, loading: loadingAutomations, error: automationsError } = useAutomations();
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance<
    WorkflowNode,
    WorkflowEdge
  > | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SidebarSection>('dashboard');
  const [showAppSidebar, setShowAppSidebar] = useState(true);
  const [showPalette, setShowPalette] = useState(true);
  const [showConfigPanel, setShowConfigPanel] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(220);
  const [paletteWidth, setPaletteWidth] = useState(280);
  const [configWidth, setConfigWidth] = useState(350);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const nodeTypes = useMemo(
    () => ({
      start: StartNode,
      task: TaskNode,
      approval: ApprovalNode,
      automated: AutomatedNode,
      end: EndNode,
    }),
    [],
  );

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (!reactFlowInstance) {
      return;
    }

    const type = event.dataTransfer.getData('application/reactflow-node-type') as WorkflowNodeType;

    if (!type) {
      return;
    }

    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    addNode(type, position.x, position.y);
  };

  const onQuickAdd = (type: WorkflowNodeType) => {
    const x = INITIAL_QUICK_ADD_X + nodes.length * QUICK_ADD_GAP;
    const y = 100 + (nodes.length % 3) * 120;
    addNode(type, x, y);
  };

  const onSelectionChange = ({
    nodes: selectedNodes,
    edges: selectedEdges,
  }: OnSelectionChangeParams<WorkflowNode, WorkflowEdge>) => {
    setSelectedNodeId(selectedNodes[0]?.id ?? null);
    setSelectedEdgeId(selectedEdges[0]?.id ?? null);
  };

  const decoratedNodes = useMemo(() => {
    const issuesByNode = new Map<string, typeof validationIssues>();

    validationIssues.forEach((issue) => {
      if (!issue.nodeId) {
        return;
      }

      const list = issuesByNode.get(issue.nodeId) ?? [];
      list.push(issue);
      issuesByNode.set(issue.nodeId, list);
    });

    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        uiIssues: issuesByNode.get(node.id) ?? [],
      },
    }));
  }, [nodes, validationIssues]);

  const exportWorkflow = () => {
    const payload = JSON.stringify(serializedWorkflow, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = `workflow-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const isSerializedWorkflow = (value: unknown): value is SerializedWorkflow => {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const candidate = value as { nodes?: unknown; edges?: unknown };
    return Array.isArray(candidate.nodes) && Array.isArray(candidate.edges);
  };

  const onImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!isSerializedWorkflow(parsed)) {
        setImportError('Invalid workflow file. Expected nodes and edges arrays.');
        return;
      }

      loadWorkflow(parsed);
      setImportError(null);
    } catch {
      setImportError('Could not parse the selected JSON file.');
    } finally {
      event.target.value = '';
    }
  };

  const loadSample = async (sampleName: string) => {
    try {
      const response = await fetch(`/fixtures/${sampleName}.json`);
      const payload = await response.json();

      if (!isSerializedWorkflow(payload)) {
        setImportError(`Sample ${sampleName} has invalid format.`);
        return;
      }

      loadWorkflow(payload);
      setImportError(null);
    } catch {
      setImportError(`Unable to load sample ${sampleName}.`);
    }
  };

  const saveDraft = async () => {
    await saveWorkflowDraft(serializedWorkflow);
  };

  const restoreDraft = async () => {
    const draft = await loadWorkflowDraft();

    if (draft) {
      loadWorkflow(draft);
    }
  };

  const beginResize = (
    target: 'sidebar' | 'palette' | 'config',
    reverse = false,
  ) => (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();

    const startX = event.clientX;
    const startWidth = target === 'sidebar' ? sidebarWidth : target === 'palette' ? paletteWidth : configWidth;
    const min = target === 'sidebar' ? 170 : target === 'palette' ? 210 : 260;
    const max = target === 'sidebar' ? 360 : target === 'palette' ? 420 : 520;

    const onMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const raw = reverse ? startWidth - delta : startWidth + delta;
      const next = Math.min(max, Math.max(min, raw));

      if (target === 'sidebar') {
        setSidebarWidth(next);
      } else if (target === 'palette') {
        setPaletteWidth(next);
      } else {
        setConfigWidth(next);
      }
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.classList.remove('is-resizing');
    };

    document.body.classList.add('is-resizing');
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>HR Workflow Designer</h1>
          <p>
            Active section: <strong>{activeSection}</strong>
          </p>
        </div>
        <div className="topbar-actions">
          <button type="button" className="secondary" onClick={undo} disabled={!canUndo}>
            Undo
          </button>
          <button type="button" className="secondary" onClick={redo} disabled={!canRedo}>
            Redo
          </button>
          <button type="button" className="secondary" onClick={autoLayout}>
            Auto Layout
          </button>
          <button type="button" className="secondary" onClick={saveDraft}>
            Save Draft
          </button>
          <button type="button" className="secondary" onClick={restoreDraft}>
            Load Draft
          </button>
          <button type="button" className="secondary" onClick={clearDraft}>
            Clear Draft
          </button>
          <button type="button" className="secondary" onClick={() => loadSample('onboarding')}>
            Load Onboarding Sample
          </button>
          <button type="button" className="secondary" onClick={() => loadSample('leave-approval')}>
            Load Leave Sample
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => loadSample('studio-testing-workspace')}
          >
            Load Studio Testing Workspace
          </button>
          <button type="button" className="secondary" onClick={() => fileInputRef.current?.click()}>
            Import JSON
          </button>
          <button type="button" onClick={exportWorkflow}>
            Export JSON
          </button>
          <div className="status-pill">Nodes: {nodes.length} | Edges: {edges.length}</div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden-input"
            onChange={onImportFile}
          />
        </div>
      </header>

      <main className="workspace-flex">
        {showAppSidebar && (
          <div className="panel-wrap" style={{ width: `${sidebarWidth}px` }}>
            <AppSidebar
              activeSection={activeSection}
              onSectionChange={setActiveSection}
              onToggle={() => setShowAppSidebar(false)}
            />
          </div>
        )}
        {!showAppSidebar && (
          <button
            type="button"
            className="collapsed-tab left"
            onClick={() => setShowAppSidebar(true)}
            aria-label="Show app sidebar"
          >
            {'>'}
          </button>
        )}

        {showAppSidebar && <div className="resize-handle" onMouseDown={beginResize('sidebar')} />}

        {showPalette && (
          <div className="panel-wrap" style={{ width: `${paletteWidth}px` }}>
            <NodePalette onAddQuick={onQuickAdd} onToggle={() => setShowPalette(false)} />
          </div>
        )}
        {!showPalette && (
          <button
            type="button"
            className="collapsed-tab left"
            onClick={() => setShowPalette(true)}
            aria-label="Show node palette"
          >
            {'>'}
          </button>
        )}

        {showPalette && <div className="resize-handle" onMouseDown={beginResize('palette')} />}

        <section className="canvas-section" ref={canvasRef} onDrop={onDrop} onDragOver={onDragOver}>
          <div className="canvas-head">
            <h2>Workflow Canvas</h2>
            <p>Drag nodes, connect edges, select to configure, and press Delete to remove.</p>
          </div>

          <ReactFlow
            fitView
            nodes={decoratedNodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onInit={setReactFlowInstance}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onSelectionChange={onSelectionChange}
            deleteKeyCode={['Delete', 'Backspace']}
            panOnDrag
            selectionOnDrag
          >
            <Controls />
            <MiniMap zoomable pannable />
            <Background variant={BackgroundVariant.Dots} size={1.2} gap={20} />
          </ReactFlow>

          {loadingAutomations && <p className="canvas-hint">Loading automation actions from mock API...</p>}
          {automationsError && <p className="error">{automationsError}</p>}
        </section>

        {showConfigPanel && <div className="resize-handle" onMouseDown={beginResize('config', true)} />}

        {showConfigPanel && (
          <div className="panel-wrap" style={{ width: `${configWidth}px` }}>
            {selectedEdge ? (
              <EdgeConfigPanel
                edge={selectedEdge}
                onToggle={() => setShowConfigPanel(false)}
                onUpdateCondition={updateEdgeCondition}
              />
            ) : (
              <NodeConfigPanel
                node={selectedNode}
                automations={automations}
                onUpdate={updateNodeData}
                onToggle={() => setShowConfigPanel(false)}
              />
            )}
          </div>
        )}
        {!showConfigPanel && (
          <button
            type="button"
            className="collapsed-tab right"
            onClick={() => setShowConfigPanel(true)}
            aria-label="Show configuration panel"
          >
            {'<'}
          </button>
        )}
      </main>

      <SandboxPanel workflow={serializedWorkflow} issues={validationIssues} />
      {importError && <p className="import-error">{importError}</p>}
    </div>
  );
};

const App = () => (
  <ReactFlowProvider>
    <DesignerApp />
  </ReactFlowProvider>
);

export default App;
