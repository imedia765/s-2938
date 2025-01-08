import { createClient } from '@supabase/supabase-js';
import { vi } from 'vitest';

export const mockAuditLogs = [
  {
    id: '1',
    timestamp: '2024-03-20T10:00:00Z',
    user_id: 'user-1',
    operation: 'create',
    table_name: 'members',
    record_id: 'record-1',
    old_values: null,
    new_values: { name: 'John Doe' },
    severity: 'info',
    compressed: false
  },
  {
    id: '2',
    timestamp: '2024-03-20T11:00:00Z',
    user_id: 'user-2',
    operation: 'update',
    table_name: 'members',
    record_id: 'record-2',
    old_values: { status: 'pending' },
    new_values: { status: 'active' },
    severity: 'warning',
    compressed: false
  }
];

export const mockMonitoringLogs = [
  {
    id: '1',
    timestamp: '2024-03-20T10:00:00Z',
    event_type: 'system_performance',
    metric_name: 'cpu_usage',
    metric_value: 75.5,
    details: { core: 1, process: 'node' },
    severity: 'warning'
  },
  {
    id: '2',
    timestamp: '2024-03-20T11:00:00Z',
    event_type: 'api_latency',
    metric_name: 'response_time',
    metric_value: 250,
    details: { endpoint: '/api/users', method: 'GET' },
    severity: 'info'
  }
];

export const mockSupabaseClient = {
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({
        range: vi.fn().mockResolvedValue({
          data: mockAuditLogs,
          error: null
        })
      })
    })
  })
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient
}));