import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useEnhancedRoleAccess } from "@/hooks/useEnhancedRoleAccess";
import { useRoleSync } from "@/hooks/useRoleSync";
import CollectorRoleCard from './CollectorRoleCard';
import RoleManagementDropdown from './RoleManagementDropdown';
import EnhancedRoleSection from './EnhancedRoleSection';
import SyncStatusIndicator from './SyncStatusIndicator';

const CollectorRolesList = () => {
  const { toast } = useToast();
  const { userRole, roleLoading, error: roleError } = useRoleAccess();
  const { userRoles: enhancedRoles, isLoading: enhancedLoading } = useEnhancedRoleAccess();
  const { syncStatus, syncRoles } = useRoleSync();

  const { data: collectors, isLoading, error } = useQuery({
    queryKey: ['collectors-roles'],
    queryFn: async () => {
      const { data: activeCollectors, error: collectorsError } = await supabase
        .from('members_collectors')
        .select('*')
        .eq('active', true);

      if (collectorsError) throw collectorsError;

      const collectorsWithRoles = await Promise.all(
        activeCollectors.map(async (collector) => {
          const { data: memberData } = await supabase
            .from('members')
            .select('auth_user_id')
            .eq('member_number', collector.member_number)
            .maybeSingle();

          if (!memberData?.auth_user_id) return null;

          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', memberData.auth_user_id);

          const { data: enhancedRoles } = await supabase
            .from('enhanced_roles')
            .select('*')
            .eq('user_id', memberData.auth_user_id);

          return {
            ...collector,
            roles: roles?.map(r => r.role) || [],
            enhanced_roles: enhancedRoles || [],
            auth_user_id: memberData.auth_user_id
          };
        })
      );

      return collectorsWithRoles.filter(c => c !== null);
    }
  });

  if (error || roleError) {
    return (
      <div className="flex items-center justify-center p-4 text-red-500">
        <AlertCircle className="w-4 h-4 mr-2" />
        <span>Error loading collectors</span>
      </div>
    );
  }

  if (isLoading || roleLoading || enhancedLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="p-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Collector</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead>Enhanced Roles</TableHead>
            <TableHead>Sync Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {collectors?.map((collector) => (
            <TableRow key={collector.id}>
              <TableCell>
                <CollectorRoleCard collector={collector} />
              </TableCell>
              <TableCell>
                <RoleManagementDropdown 
                  collector={collector}
                  onRoleUpdate={(role, action) => {
                    // Role update logic will be implemented
                  }}
                />
              </TableCell>
              <TableCell>
                <EnhancedRoleSection
                  collector={collector}
                  onEnhancedRoleUpdate={(roleName, isActive) => {
                    // Enhanced role update logic will be implemented
                  }}
                />
              </TableCell>
              <TableCell>
                <SyncStatusIndicator
                  collector={collector}
                  onSync={() => syncRoles()}
                  syncStatus={syncStatus}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};

export default CollectorRolesList;