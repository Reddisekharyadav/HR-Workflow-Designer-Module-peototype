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
  - Approach: use a command-history model that records graph mutations (add node, move node, connect edge, delete node, update form field).
  - Example: HR admin edits Task assignee from "HR Ops" to "HRBP", then presses Undo to restore previous value without losing other canvas changes.
  - Example: admin creates three nodes and two edges, then uses Ctrl+Z twice to remove only the latest edge operations.

- Visual node-level error badges
  - Approach: map validation issues to node IDs and render inline badges on each affected node (error and warning states).
  - Example: a Task node with no outgoing edge shows "Missing next step" badge directly on canvas.
  - Example: Start node with incoming edge gets a red "Invalid incoming connection" badge and tooltip guidance.

- Auto-layout integration (dagre or elk)
  - Approach: add a "Auto Arrange" action that computes positions from graph topology and applies smooth transitions.
  - Example: onboarding flow automatically organizes to top-down lane with Start at top and End at bottom.
  - Example: branched approval flow places parallel branches side by side and merges back into final automation step.

- Better branch-aware simulation with conditional paths
  - Approach: introduce edge conditions and runtime context (for example, leaveDays, department, grade) to choose execution paths.
  - Example: if leaveDays <= 2 route directly to manager approval; else route through HRBP and Director approvals.
  - Example: if documentValidation fails, route to correction task and re-run validation loop until successful.

- Persist workflows to backend
  - Approach: add workflow CRUD APIs with versioning and optimistic locking.
  - Example endpoints: create workflow draft, update by version, publish version, list published workflows.
  - Example: two admins editing same workflow get a conflict prompt and can merge changes instead of overwriting each other.


