import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useCollectorRoles = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role, action }: { userId: string; role: 'collector'; action: 'add' | 'remove' }) => {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const { data: memberData } = await supabase
        .from('members')
        .select('auth_user_id')
        .eq('member_number', userId)
        .maybeSingle();

      if (!memberData?.auth_user_id) {
        throw new Error('Member not found or no auth user ID');
      }

      if (action === 'add') {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: memberData.auth_user_id, role });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', memberData.auth_user_id)
          .eq('role', role);
        if (error) throw error;
      }
    },
    meta: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['members_collectors'] });
        toast({
          title: "Role updated",
          description: "The collector's roles have been updated successfully.",
        });
      },
      onError: (error: Error) => {
        toast({
          title: "Error updating role",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  });

  const updateEnhancedRoleMutation = useMutation({
    mutationFn: async ({ userId, roleName, isActive }: { userId: string; roleName: string; isActive: boolean }) => {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const { data: memberData } = await supabase
        .from('members')
        .select('auth_user_id')
        .eq('member_number', userId)
        .maybeSingle();

      if (!memberData?.auth_user_id) {
        throw new Error('Member not found or no auth user ID');
      }

      const { error } = await supabase
        .from('enhanced_roles')
        .upsert({
          user_id: memberData.auth_user_id,
          role_name: roleName,
          is_active: isActive,
          updated_by: (await supabase.auth.getUser()).data.user?.id
        });
      if (error) throw error;
    },
    meta: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['members_collectors'] });
        toast({
          title: "Enhanced role updated",
          description: "The enhanced role status has been updated.",
        });
      },
      onError: (error: Error) => {
        toast({
          title: "Error updating enhanced role",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  });

  return {
    updateRoleMutation,
    updateEnhancedRoleMutation
  };
};