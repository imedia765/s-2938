import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Users } from 'lucide-react';
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import PrintButtons from "@/components/PrintButtons";
import { useState } from 'react';
import PaginationControls from './ui/pagination/PaginationControls';
import { Collector } from '@/types/collector';
import CollectorAccordionItem from './collectors/CollectorAccordionItem';
import { useCollectorSync } from '@/hooks/useCollectorSync';
import { useCollectorRoles } from '@/hooks/useCollectorRoles';
import RoleManagementDropdown from './collectors/RoleManagementDropdown';
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type UserRole = Database['public']['Enums']['app_role'];

const ITEMS_PER_PAGE = 10;

const CollectorsList = () => {
  const [page, setPage] = useState(1);
  const syncRolesMutation = useCollectorSync();
  const { updateRoleMutation, updateEnhancedRoleMutation } = useCollectorRoles();
  const { toast } = useToast();

  const { data: allMembers } = useQuery({
    queryKey: ['all_members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('member_number', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: paymentsData, isLoading: collectorsLoading, error: collectorsError } = useQuery({
    queryKey: ['members_collectors', page],
    queryFn: async () => {
      console.log('Fetching collectors from members_collectors...');
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data: collectorsData, error: collectorsError, count } = await supabase
        .from('members_collectors')
        .select(`
          id,
          name,
          prefix,
          number,
          email,
          phone,
          active,
          created_at,
          updated_at,
          member_number
        `, { count: 'exact' })
        .order('number', { ascending: true })
        .range(from, to);
      
      if (collectorsError) {
        console.error('Error fetching collectors:', collectorsError);
        throw collectorsError;
      }

      if (!collectorsData) return { data: [], count: 0 };

      const collectorsWithCounts = await Promise.all(collectorsData.map(async (collector) => {
        const { count } = await supabase
          .from('members')
          .select('*', { count: 'exact', head: true })
          .eq('collector', collector.name);

        // Fetch user roles for this collector
        const { data: memberData } = await supabase
          .from('members')
          .select('auth_user_id')
          .eq('member_number', collector.member_number)
          .single();

        let roles: UserRole[] = [];
        if (memberData?.auth_user_id) {
          const { data: rolesData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', memberData.auth_user_id);
          roles = rolesData?.map(r => r.role as UserRole) || [];
        }

        return {
          ...collector,
          memberCount: count || 0,
          roles
        };
      }));

      return {
        data: collectorsWithCounts as (Collector & { roles: UserRole[] })[],
        count: count || 0
      };
    },
  });

  const collectors = paymentsData?.data || [];
  const totalPages = Math.ceil((paymentsData?.count || 0) / ITEMS_PER_PAGE);

  const handleRoleUpdate = async (collector: Collector & { roles: UserRole[] }, role: 'collector', action: 'add' | 'remove') => {
    try {
      await updateRoleMutation.mutateAsync({ 
        userId: collector.member_number || '', 
        role, 
        action 
      });
      
      toast({
        title: "Role updated",
        description: `Successfully ${action}ed ${role} role for ${collector.name}`,
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error updating role",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  if (collectorsLoading) return <div className="text-center py-4">Loading collectors...</div>;
  if (collectorsError) return <div className="text-center py-4 text-red-500">Error loading collectors: {collectorsError.message}</div>;
  if (!collectors?.length) return <div className="text-center py-4">No collectors found</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <PrintButtons allMembers={allMembers} />
      </div>

      <Accordion type="single" collapsible className="space-y-4">
        {collectors.map((collector) => (          
          <CollectorAccordionItem
            key={collector.id}
            collector={collector}
            onRoleUpdate={(userId, role, action) => updateRoleMutation.mutate({ userId, role: 'collector', action })}
            onEnhancedRoleUpdate={(userId, roleName, isActive) => 
              updateEnhancedRoleMutation.mutate({ userId, roleName, isActive })}
            onSync={() => syncRolesMutation.mutate()}
            isSyncing={syncRolesMutation.isPending}
            roleManagementDropdown={
              <RoleManagementDropdown
                currentRoles={collector.roles}
                onRoleUpdate={(role, action) => handleRoleUpdate(collector, 'collector', action)}
                disabled={updateRoleMutation.isPending}
              />
            }
          />
        ))}
      </Accordion>

      {totalPages > 1 && (
        <div className="py-4">
          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
};

export default CollectorsList;