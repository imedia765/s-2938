import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const RoleMaintenanceControls = () => {
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  const { data: report, refetch } = useQuery({
    queryKey: ['collector-role-report'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_collector_role_fix_report');
      if (error) throw error;
      return data;
    }
  });

  const handleMaintenance = async () => {
    try {
      setIsRunning(true);
      const { error } = await supabase.rpc('maintain_collector_roles');
      if (error) throw error;
      
      await refetch();
      
      toast({
        title: "Maintenance completed",
        description: "Collector roles have been synchronized",
      });
    } catch (error) {
      console.error('Maintenance error:', error);
      toast({
        title: "Maintenance failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="p-4 bg-dashboard-card border-dashboard-cardBorder">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-dashboard-accent1" />
          <h3 className="text-lg font-medium text-white">Role Maintenance</h3>
        </div>
        <Button
          variant="outline"
          onClick={handleMaintenance}
          disabled={isRunning}
          className="flex items-center gap-2"
        >
          {isRunning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Run Maintenance
        </Button>
      </div>

      {report && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-dashboard-accent1/10">
              Total: {report.total_processed}
            </Badge>
            <Badge variant="outline" className="bg-green-500/10 text-green-400">
              Success: {report.successful}
            </Badge>
            {report.failed > 0 && (
              <Badge variant="outline" className="bg-red-500/10 text-red-400">
                Failed: {report.failed}
              </Badge>
            )}
          </div>
          {report.failed > 0 && report.failure_details && (
            <div className="mt-4 text-sm text-dashboard-muted">
              <p className="font-medium mb-2">Failed Operations:</p>
              <ul className="list-disc pl-4 space-y-1">
                {report.failure_details.map((detail: any, index: number) => (
                  <li key={index} className="text-red-400">
                    {detail.member_number}: {detail.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default RoleMaintenanceControls;