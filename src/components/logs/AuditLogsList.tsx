import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuditLog } from '@/types/audit';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';

export const AuditLogsList: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .range(0, 49);

        if (error) throw error;
        setLogs(data as AuditLog[] || []);
      } catch (error) {
        console.error('Error fetching audit logs:', error);
        toast({
          title: "Error fetching logs",
          description: "There was a problem loading the audit logs.",
          variant: "destructive"
        });
      }
    };

    fetchLogs();

    // Set up real-time subscription
    const subscription = supabase
      .channel('audit_logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'audit_logs'
        },
        (payload) => {
          console.log('New audit log event:', payload);
          setLogs(prevLogs => {
            const newLog = payload.new as AuditLog;
            return [newLog, ...prevLogs.slice(0, 49)];
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  const getSeverityClass = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'warning':
        return 'bg-dashboard-warning text-black';
      case 'error':
        return 'bg-dashboard-error text-white';
      case 'critical':
        return 'bg-red-800 text-white';
      default:
        return 'bg-dashboard-accent1 text-white';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="dashboard-card">
      <h2 className="text-lg font-semibold mb-4 text-dashboard-accent1">Audit Logs</h2>
      <ScrollArea className="h-[600px]">
        <div className="space-y-2">
          {logs.length === 0 ? (
            <p className="text-dashboard-muted">No audit logs available</p>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-3 glass-card hover:border-dashboard-accent1 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-dashboard-text">
                    {formatTimestamp(log.timestamp)}
                  </span>
                  <span
                    data-testid={`severity-${log.id}`}
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityClass(log.severity)}`}
                  >
                    {log.severity}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-dashboard-text">
                    <span className="font-medium text-dashboard-accent2">Operation:</span> {log.operation}
                  </p>
                  <p className="text-sm text-dashboard-text">
                    <span className="font-medium text-dashboard-accent2">Table:</span> {log.table_name}
                  </p>
                  {log.record_id && (
                    <p className="text-sm text-dashboard-text">
                      <span className="font-medium text-dashboard-accent2">Record ID:</span> {log.record_id}
                    </p>
                  )}
                  {log.old_values && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-dashboard-accent1 hover:text-dashboard-highlight">
                        Old Values
                      </summary>
                      <pre className="mt-2 p-2 bg-dashboard-card rounded text-xs overflow-x-auto text-dashboard-text">
                        {JSON.stringify(log.old_values, null, 2)}
                      </pre>
                    </details>
                  )}
                  {log.new_values && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-dashboard-accent1 hover:text-dashboard-highlight">
                        New Values
                      </summary>
                      <pre className="mt-2 p-2 bg-dashboard-card rounded text-xs overflow-x-auto text-dashboard-text">
                        {JSON.stringify(log.new_values, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};