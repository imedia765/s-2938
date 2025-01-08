import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AuditLogsList } from '@/components/logs/AuditLogsList';
import { mockAuditLogs } from '../../mocks/supabaseMock';
import { useToast } from '@/components/ui/use-toast';

// Mock the toast component
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('AuditLogsList', () => {
  beforeEach(() => {
    render(<AuditLogsList />);
  });

  it('renders the loading state initially', () => {
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('displays audit logs after loading', async () => {
    await waitFor(() => {
      mockAuditLogs.forEach(log => {
        expect(screen.getByText(log.operation)).toBeInTheDocument();
        expect(screen.getByText(log.table_name)).toBeInTheDocument();
      });
    });
  });

  it('handles pagination correctly', async () => {
    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByText('Page 2')).toBeInTheDocument();
    });
  });

  it('displays error state appropriately', async () => {
    // Force an error state
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    await waitFor(() => {
      expect(screen.getByText(/error loading audit logs/i)).toBeInTheDocument();
    });
  });

  it('formats timestamps correctly', async () => {
    await waitFor(() => {
      const formattedDate = new Date(mockAuditLogs[0].timestamp).toLocaleDateString();
      expect(screen.getByText(formattedDate)).toBeInTheDocument();
    });
  });

  it('shows severity indicators with correct styling', async () => {
    await waitFor(() => {
      const severityBadge = screen.getByText(mockAuditLogs[0].severity);
      expect(severityBadge).toHaveClass('bg-dashboard-warning');
    });
  });
});