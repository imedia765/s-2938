import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AuditLogsView from '@/components/AuditLogsView';
import { mockAuditLogs } from '../mocks/supabaseMock';

describe('AuditLogsView', () => {
  beforeEach(() => {
    render(<AuditLogsView />);
  });

  it('renders the header with correct title', () => {
    expect(screen.getByText('System Logs')).toBeInTheDocument();
    expect(screen.getByText('View and manage system audit and monitoring logs')).toBeInTheDocument();
  });

  it('shows the correct tabs', () => {
    expect(screen.getByRole('tab', { name: /audit logs/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /monitoring logs/i })).toBeInTheDocument();
  });

  it('switches between tabs correctly', () => {
    const monitoringTab = screen.getByRole('tab', { name: /monitoring logs/i });
    fireEvent.click(monitoringTab);
    expect(monitoringTab).toHaveAttribute('aria-selected', 'true');
  });

  it('displays the correct content for each tab', () => {
    // Check Audit Logs tab content
    expect(screen.getByRole('tab', { name: /audit logs/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('audit-logs-list')).toBeInTheDocument();

    // Switch to Monitoring Logs tab
    const monitoringTab = screen.getByRole('tab', { name: /monitoring logs/i });
    fireEvent.click(monitoringTab);
    expect(screen.getByTestId('monitoring-logs-list')).toBeInTheDocument();
  });

  it('maintains state when switching tabs', () => {
    const auditTab = screen.getByRole('tab', { name: /audit logs/i });
    const monitoringTab = screen.getByRole('tab', { name: /monitoring logs/i });

    fireEvent.click(monitoringTab);
    fireEvent.click(auditTab);

    expect(auditTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('audit-logs-list')).toBeInTheDocument();
  });
});