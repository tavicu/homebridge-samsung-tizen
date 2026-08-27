import { useConfig } from '../../composables/useConfig';

export function useDashboard() {
  const { config } = useConfig();

  return { config };
}
