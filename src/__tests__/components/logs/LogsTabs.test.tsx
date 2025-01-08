import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LogsTabs } from '@/components/logs/LogsTabs';
import { LOGS_TABS } from '@/constants/logs';

describe('LogsTabs', () => {
  const mockOnTabChange = vi.fn();

  const defaultProps = {
    activeTab: LOGS_TABS.AUDIT,
    onTabChange: mockOnTabChange
  };

  beforeEach(() => {
    render(<LogsTabs {...defaultProps} />);
    mockOnTabChange.mockClear();
  });

  it('renders all tab options', () => {
    expect(screen.getByRole('tab', { name: /audit logs/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /monitoring logs/i })).toBeInTheDocument();
  });

  it('shows active tab correctly', () => {
    const auditTab = screen.getByRole('tab', { name: /audit logs/i });
    expect(auditTab).toHaveAttribute('aria-selected', 'true');
  });

  it('calls onTabChange when clicking a tab', () => {
    const monitoringTab = screen.getByRole('tab', { name: /monitoring logs/i });
    fireEvent.click(monitoringTab);
    expect(mockOnTabChange).toHaveBeenCalledWith(LOGS_TABS.MONITORING);
  });

  it('applies correct styling to active tab', () => {
    const activeTab = screen.getByRole('tab', { name: /audit logs/i });
    expect(activeTab).toHaveClass('text-dashboard-accent1');
  });

  it('applies correct styling to inactive tab', () => {
    const inactiveTab = screen.getByRole('tab', { name: /monitoring logs/i });
    expect(inactiveTab).toHaveClass('text-dashboard-text');
  });

  it('maintains tab state after re-render', () => {
    const { rerender } = render(<LogsTabs {...defaultProps} />);
    const monitoringTab = screen.getByRole('tab', { name: /monitoring logs/i });
    
    fireEvent.click(monitoringTab);
    rerender(<LogsTabs {...defaultProps} activeTab={LOGS_TABS.MONITORING} />);
    
    expect(monitoringTab).toHaveAttribute('aria-selected', 'true');
  });
});