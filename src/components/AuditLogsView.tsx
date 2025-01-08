import React, { useState } from 'react';
import LogsHeader from './logs/LogsHeader';
import { LogsTabs } from './logs/LogsTabs';
import { AuditLogsList } from './logs/AuditLogsList';
import MonitoringLogsList from './logs/MonitoringLogsList';
import { DebugConsole } from './logs/DebugConsole';
import { LOGS_TABS, LogsTabsType } from '@/constants/logs';
import { TestRunner } from './logs/TestRunner';

const AuditLogsView = () => {
  const [activeTab, setActiveTab] = useState<LogsTabsType>(LOGS_TABS.AUDIT);
  const [debugLogs] = useState(['Debug logging initialized', 'Real-time subscriptions active']);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="bg-dashboard-card rounded-lg p-6 shadow-lg">
        <LogsHeader 
          title="System Logs"
          subtitle="View and manage system audit and monitoring logs"
        />
        
        <div className="mt-6">
          <LogsTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <TestRunner />
        
        <div className="bg-dashboard-card rounded-lg shadow-lg">
          {activeTab === LOGS_TABS.AUDIT && <AuditLogsList />}
          {activeTab === LOGS_TABS.MONITORING && <MonitoringLogsList />}
        </div>
        
        <div className="bg-dashboard-card rounded-lg shadow-lg p-6">
          <DebugConsole logs={debugLogs} />
        </div>
      </div>
    </div>
  );
};

export default AuditLogsView;