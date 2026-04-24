# HR Workflow Designer Module (React + React Flow)

A prototype workflow builder for HR admins to design and simulate internal workflows like onboarding, leave approval, and document verification.

## What Is Implemented

- React + TypeScript + Vite app
- React Flow canvas with custom node types:
  - Start
  - Task
  - Approval
  - Automated Step
  - End
- Drag-and-drop node creation from sidebar
- Edge creation, node/edge deletion, node selection
- Node configuration panel with dynamic and type-safe forms
- Mock API layer:
  - `GET /automations` equivalent via `getAutomations()`
  - `POST /simulate` equivalent via `simulateWorkflow()`
- Sandbox panel:
  - Serializes graph JSON
  - Validates structure (start/end constraints, connection gaps, cycle checks)
  - Runs mock simulation and displays execution steps
- Import/Export workflow JSON from the top toolbar
- Built-in sample fixtures:
  - `public/fixtures/onboarding.json`
  - `public/fixtures/leave-approval.json`
  - `public/fixtures/studio-testing-workspace.json`
- Modular architecture (canvas logic, node logic, API logic separated)

## Run Locally

```bash
npm install
npm run dev
```

Build check:

```bash
npm run build
```

## 60-Second Demo Script

1. Click **Load Onboarding Sample** in the top bar.
2. Select any node and show editable fields in the Node Configuration panel.
3. Open **Show Serialized JSON** in the sandbox and point to graph structure.
4. Click **Run Simulation** and show step-by-step execution log.
5. Click **Export JSON** to download current workflow.
6. Click **Import JSON** and load either the exported file or `public/fixtures/leave-approval.json`.

## Testing Workspace Nodes (From UI Reference)

The Studio Testing Workspace sample includes these test-friendly nodes inspired by your reference image:

- Data Collection
- Trigger Automation
- Data Validation
- Output Generation

How to run this specific workspace:

1. Start the app with `npm run dev`.
2. In the top toolbar, click **Load Studio Testing Workspace**.
3. Open sandbox and click **Run Simulation**.

## Architecture

```text
src/
  api/
    mockData.ts          # Mock automation definitions
    workflowApi.ts       # Mock async API contracts (automations + simulate)
  components/
    nodes/
      *Node.tsx          # Custom React Flow node renderers
      WorkflowNodeBase.tsx
    panels/
      NodePalette.tsx    # Drag source + quick add
      NodeConfigPanel.tsx# Dynamic edit forms by node type
      SandboxPanel.tsx   # Validation + simulation execution timeline
  hooks/
    useAutomations.ts    # Automation fetch abstraction
    useWorkflowDesigner.ts # Canvas state, selection, updates, serialization
  types/
    workflow.ts          # Domain models, node data unions, response contracts
  utils/
    graphValidation.ts   # Structural validation + cycle detection
  App.tsx                # Composition root and React Flow integration
```

## Design Choices

- **Discriminated unions for node data**: each node type has strict fields, making form rendering and updates type-safe and extensible.
- **Dedicated hook for workflow state**: keeps React Flow state transitions (`nodes`, `edges`, selection, graph serialization) outside the UI layer.
- **Mock API abstraction**: simulation and action loading are asynchronous and isolated, so replacing with real backend calls is straightforward.
- **Validation as utility**: graph integrity checks live in one place and are reused by both UI display and simulation gatekeeping.

## Node Form Coverage

- Start Node: start title, metadata key-value pairs
- Task Node: title (required), description, assignee, due date, custom key-value fields
- Approval Node: title, approver role, auto-approve threshold
- Automated Step Node: title, action from mock API, dynamic parameter inputs by selected action
- End Node: end message, summary flag toggle

## Assumptions

- No authentication and no persistent backend required.
- One Start node is expected per workflow for clean graph entry.
- Simulation is deterministic and modeled as topological execution order.
- Dynamic action params are string-based in this prototype.

## Validation Rules Included

- Workflow has nodes
- Exactly one Start node
- At least one End node
- Start node must be the first node (root)
- Start node has no incoming edges
- Warnings for missing incoming/outgoing connections
- Cycle detection

## If More Time Were Available

- Undo/redo stack
- Visual node-level error badges
- Auto-layout integration (dagre/elk)
- Better branch-aware simulation with conditional paths
- Persist workflows to backend
