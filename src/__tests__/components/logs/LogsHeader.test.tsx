import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LogsHeader from '@/components/logs/LogsHeader';

describe('LogsHeader', () => {
  const defaultProps = {
    title: 'Test Title',
    subtitle: 'Test Subtitle'
  };

  it('renders with provided title and subtitle', () => {
    render(<LogsHeader {...defaultProps} />);
    expect(screen.getByText(defaultProps.title)).toBeInTheDocument();
    expect(screen.getByText(defaultProps.subtitle)).toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    render(<LogsHeader {...defaultProps} />);
    expect(screen.getByText(defaultProps.title)).toHaveClass('text-2xl', 'font-bold');
    expect(screen.getByText(defaultProps.subtitle)).toHaveClass('text-muted-foreground');
  });

  it('renders with long text correctly', () => {
    const longProps = {
      title: 'Very Long Title '.repeat(10),
      subtitle: 'Very Long Subtitle '.repeat(10)
    };
    render(<LogsHeader {...longProps} />);
    expect(screen.getByText(longProps.title)).toBeInTheDocument();
    expect(screen.getByText(longProps.subtitle)).toBeInTheDocument();
  });

  it('handles empty strings gracefully', () => {
    render(<LogsHeader title="" subtitle="" />);
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });
});