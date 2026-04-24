import type { AutomationDefinition } from '../types/workflow';

export const AUTOMATIONS: AutomationDefinition[] = [
  {
    id: 'send_email',
    label: 'Send Email',
    params: ['to', 'subject'],
  },
  {
    id: 'generate_doc',
    label: 'Generate Document',
    params: ['template', 'recipient'],
  },
  {
    id: 'slack_notify',
    label: 'Slack Notify',
    params: ['channel', 'message'],
  },
];
