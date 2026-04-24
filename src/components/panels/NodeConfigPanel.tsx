import type { ChangeEvent } from 'react';
import type {
  AutomationDefinition,
  KeyValueField,
  WorkflowNode,
} from '../../types/workflow';

type NodeConfigPanelProps = {
  node: WorkflowNode | null;
  automations: AutomationDefinition[];
  onUpdate: (nodeId: string, updater: (node: WorkflowNode) => WorkflowNode) => void;
  onToggle: () => void;
};

const KeyValueEditor = ({
  title,
  list,
  onChange,
}: {
  title: string;
  list: KeyValueField[];
  onChange: (next: KeyValueField[]) => void;
}) => {
  const updateRow = (index: number, key: 'key' | 'value', value: string) => {
    onChange(list.map((item, row) => (row === index ? { ...item, [key]: value } : item)));
  };

  return (
    <div className="field-block">
      <label>{title}</label>
      {list.map((field, index) => (
        <div key={`${title}-${index}`} className="kv-row">
          <input
            placeholder="Key"
            value={field.key}
            onChange={(event) => updateRow(index, 'key', event.target.value)}
          />
          <input
            placeholder="Value"
            value={field.value}
            onChange={(event) => updateRow(index, 'value', event.target.value)}
          />
        </div>
      ))}
      <button type="button" onClick={() => onChange([...list, { key: '', value: '' }])}>
        Add Field
      </button>
    </div>
  );
};

const NodeConfigPanel = ({ node, automations, onUpdate, onToggle }: NodeConfigPanelProps) => {
  if (!node) {
    return (
      <aside className="panel config-panel">
        <div className="panel-title-row">
          <h2>Node Configuration</h2>
          <button type="button" className="icon-toggle" onClick={onToggle} aria-label="Hide configuration panel">
            {'>'}
          </button>
        </div>
        <p>Select a node from canvas to edit its properties.</p>
      </aside>
    );
  }

  const data = node.data;

  const update = (updater: (currentNode: WorkflowNode) => WorkflowNode) => {
    onUpdate(node.id, updater);
  };

  return (
    <aside className="panel config-panel">
      <div className="panel-title-row">
        <h2>Node Configuration</h2>
        <button type="button" className="icon-toggle" onClick={onToggle} aria-label="Hide configuration panel">
          {'>'}
        </button>
      </div>
      <p>
        Editing <strong>{node.id}</strong> ({data.type})
      </p>

      {data.type === 'start' && (
        <>
          <div className="field-block">
            <label>Start title</label>
            <input
              value={data.startTitle}
              onChange={(event) =>
                update((currentNode) =>
                  currentNode.data.type === 'start'
                    ? {
                        ...currentNode,
                        data: { ...currentNode.data, startTitle: event.target.value },
                      }
                    : currentNode,
                )
              }
            />
          </div>
          <KeyValueEditor
            title="Metadata (optional)"
            list={data.metadata}
            onChange={(next) =>
              update((currentNode) =>
                currentNode.data.type === 'start'
                  ? {
                      ...currentNode,
                      data: { ...currentNode.data, metadata: next },
                    }
                  : currentNode,
              )
            }
          />
        </>
      )}

      {data.type === 'task' && (
        <>
          <div className="field-block">
            <label>Title *</label>
            <input
              value={data.title}
              required
              onChange={(event) =>
                update((currentNode) =>
                  currentNode.data.type === 'task'
                    ? {
                        ...currentNode,
                        data: { ...currentNode.data, title: event.target.value },
                      }
                    : currentNode,
                )
              }
            />
          </div>
          <div className="field-block">
            <label>Description</label>
            <textarea
              value={data.description}
              onChange={(event) =>
                update((currentNode) =>
                  currentNode.data.type === 'task'
                    ? {
                        ...currentNode,
                        data: { ...currentNode.data, description: event.target.value },
                      }
                    : currentNode,
                )
              }
            />
          </div>
          <div className="field-block">
            <label>Assignee</label>
            <input
              value={data.assignee}
              onChange={(event) =>
                update((currentNode) =>
                  currentNode.data.type === 'task'
                    ? {
                        ...currentNode,
                        data: { ...currentNode.data, assignee: event.target.value },
                      }
                    : currentNode,
                )
              }
            />
          </div>
          <div className="field-block">
            <label>Due date</label>
            <input
              type="date"
              value={data.dueDate}
              onChange={(event) =>
                update((currentNode) =>
                  currentNode.data.type === 'task'
                    ? {
                        ...currentNode,
                        data: { ...currentNode.data, dueDate: event.target.value },
                      }
                    : currentNode,
                )
              }
            />
          </div>
          <KeyValueEditor
            title="Custom fields (optional)"
            list={data.customFields}
            onChange={(next) =>
              update((currentNode) =>
                currentNode.data.type === 'task'
                  ? {
                      ...currentNode,
                      data: { ...currentNode.data, customFields: next },
                    }
                  : currentNode,
              )
            }
          />
        </>
      )}

      {data.type === 'approval' && (
        <>
          <div className="field-block">
            <label>Title</label>
            <input
              value={data.title}
              onChange={(event) =>
                update((currentNode) =>
                  currentNode.data.type === 'approval'
                    ? {
                        ...currentNode,
                        data: { ...currentNode.data, title: event.target.value },
                      }
                    : currentNode,
                )
              }
            />
          </div>
          <div className="field-block">
            <label>Approver role</label>
            <input
              value={data.approverRole}
              onChange={(event) =>
                update((currentNode) =>
                  currentNode.data.type === 'approval'
                    ? {
                        ...currentNode,
                        data: { ...currentNode.data, approverRole: event.target.value },
                      }
                    : currentNode,
                )
              }
            />
          </div>
          <div className="field-block">
            <label>Auto-approve threshold</label>
            <input
              type="number"
              value={data.autoApproveThreshold}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                update((currentNode) =>
                  currentNode.data.type === 'approval'
                    ? {
                        ...currentNode,
                        data: {
                          ...currentNode.data,
                          autoApproveThreshold: Number(event.target.value || 0),
                        },
                      }
                    : currentNode,
                )
              }
            />
          </div>
        </>
      )}

      {data.type === 'automated' && (
        <>
          <div className="field-block">
            <label>Title</label>
            <input
              value={data.title}
              onChange={(event) =>
                update((currentNode) =>
                  currentNode.data.type === 'automated'
                    ? {
                        ...currentNode,
                        data: { ...currentNode.data, title: event.target.value },
                      }
                    : currentNode,
                )
              }
            />
          </div>
          <div className="field-block">
            <label>Action</label>
            <select
              value={data.actionId}
              onChange={(event) => {
                const nextId = event.target.value;
                const selected = automations.find((item) => item.id === nextId);

                update((currentNode) => {
                  if (currentNode.data.type !== 'automated') {
                    return currentNode;
                  }

                  const currentParams = currentNode.data.actionParams;
                  const nextParams: Record<string, string> = {};
                  selected?.params.forEach((param) => {
                    nextParams[param] = currentParams[param] ?? '';
                  });

                  return {
                    ...currentNode,
                    data: {
                      ...currentNode.data,
                      actionId: nextId,
                      actionParams: nextParams,
                    },
                  };
                });
              }}
            >
              <option value="">Select action</option>
              {automations.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {automations
            .find((item) => item.id === data.actionId)
            ?.params.map((param) => (
              <div className="field-block" key={param}>
                <label>{param}</label>
                <input
                  value={data.actionParams[param] ?? ''}
                  onChange={(event) =>
                    update((currentNode) =>
                      currentNode.data.type === 'automated'
                        ? {
                            ...currentNode,
                            data: {
                              ...currentNode.data,
                              actionParams: {
                                ...currentNode.data.actionParams,
                                [param]: event.target.value,
                              },
                            },
                          }
                        : currentNode,
                    )
                  }
                />
              </div>
            ))}
        </>
      )}

      {data.type === 'end' && (
        <>
          <div className="field-block">
            <label>End message</label>
            <input
              value={data.endMessage}
              onChange={(event) =>
                update((currentNode) =>
                  currentNode.data.type === 'end'
                    ? {
                        ...currentNode,
                        data: { ...currentNode.data, endMessage: event.target.value },
                      }
                    : currentNode,
                )
              }
            />
          </div>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={data.summaryFlag}
              onChange={(event) =>
                update((currentNode) =>
                  currentNode.data.type === 'end'
                    ? {
                        ...currentNode,
                        data: { ...currentNode.data, summaryFlag: event.target.checked },
                      }
                    : currentNode,
                )
              }
            />
            Summary flag
          </label>
        </>
      )}
    </aside>
  );
};

export default NodeConfigPanel;
