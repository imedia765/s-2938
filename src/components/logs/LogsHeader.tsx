import React from 'react';

interface LogsHeaderProps {
  title: string;
  subtitle: string;
}

const LogsHeader: React.FC<LogsHeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="space-y-2">
      <h1 className="text-3xl font-bold text-dashboard-accent1">{title}</h1>
      <p className="text-dashboard-text text-lg">{subtitle}</p>
    </div>
  );
};

export default LogsHeader;