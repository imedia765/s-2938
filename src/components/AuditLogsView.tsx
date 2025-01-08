import React, { useState, useEffect } from 'react';
import LogsHeader from './logs/LogsHeader';
import { LogsTabs } from './logs/LogsTabs';
import { AuditLogsList } from './logs/AuditLogsList';
import MonitoringLogsList from './logs/MonitoringLogsList';
import { DebugConsole } from './logs/DebugConsole';
import { LOGS_TABS, LogsTabsType } from '@/constants/logs';
import { TestRunner } from './logs/TestRunner';
import { supabase } from "@/integrations/supabase/client";

const AuditLogsView = () => {
  const [activeTab, setActiveTab] = useState<LogsTabsType>(LOGS_TABS.AUDIT);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  useEffect(() => {
    const fetchInitialLogs = async () => {
      try {
        // Fetch recent auth events using table_name filter instead of operation
        const { data: authEvents, error: authError } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('table_name', 'auth')
          .order('timestamp', { ascending: false })
          .limit(5);

        if (authError) throw authError;

        // Format auth events for debug console
        const formattedAuthLogs = authEvents?.map(event => {
          const values = event.new_values as any;
          return `Auth Event: ${values.message || 'User action'} (${new Date(event.timestamp).toLocaleString()})`;
        }) || [];

        // Initialize debug logs with system info and auth events
        setDebugLogs([
          'Debug logging initialized',
          'Real-time subscriptions active',
          `Current environment: ${import.meta.env.MODE}`,
          ...formattedAuthLogs
        ]);

        // Set up real-time subscription for new auth events
        const subscription = supabase
          .channel('auth_events')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'audit_logs',
              filter: 'table_name=eq.auth'
            },
            (payload) => {
              const values = (payload.new as any).new_values;
              setDebugLogs(prev => [
                `Auth Event: ${values.message || 'User action'} (${new Date().toLocaleString()})`,
                ...prev
              ]);
            }
          )
          .subscribe();

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error fetching logs:', error);
        setDebugLogs(prev => [
          `Error: Failed to fetch initial logs - ${error.message}`,
          ...prev
        ]);
      }
    };

    fetchInitialLogs();
  }, []);

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