import { useEffect, useState } from 'react';
import { getAutomations } from '../api/workflowApi';
import type { AutomationDefinition } from '../types/workflow';

export const useAutomations = () => {
  const [automations, setAutomations] = useState<AutomationDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const response = await getAutomations();

        if (isMounted) {
          setAutomations(response);
          setError(null);
        }
      } catch {
        if (isMounted) {
          setError('Failed to load automation actions.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    automations,
    loading,
    error,
  };
};
