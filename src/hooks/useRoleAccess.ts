import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type UserRole = 'admin' | 'collector' | 'member' | null;

const ROLE_STALE_TIME = 1000 * 60 * 5; // 5 minutes

export const useRoleAccess = () => {
  const { toast } = useToast();

  const { data: userRole, isLoading: roleLoading, error } = useQuery({
    queryKey: ['userRole'],
    queryFn: async () => {
      console.log('Fetching user role from central hook...');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        console.log('No session found in central role check');
        return null;
      }

      console.log('Session user in central role check:', session.user.id);

      // First check user_roles table
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (roleError) {
        console.error('Error fetching role from user_roles:', roleError);
        toast({
          title: "Error",
          description: roleError.message,
          variant: "destructive",
        });
        throw roleError;
      }

      if (roleData?.role) {
        console.log('Found role in user_roles:', roleData.role);
        return roleData.role as UserRole;
      }

      // If no role in user_roles, check if user is a collector in members table
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('collector')
        .eq('auth_user_id', session.user.id)
        .maybeSingle();

      if (memberError) {
        console.error('Error checking member collector status:', memberError);
        return 'member' as UserRole;
      }

      if (memberData?.collector) {
        console.log('User is a collector:', memberData.collector);
        return 'collector' as UserRole;
      }

      // Default to member role
      console.log('Defaulting to member role');
      return 'member' as UserRole;
    },
    staleTime: ROLE_STALE_TIME,
    retry: 2,
    meta: {
      errorMessage: "Failed to fetch user role"
    }
  });

  const canAccessTab = (tab: string): boolean => {
    console.log('Checking access for tab:', tab, 'User role:', userRole);
    
    if (!userRole) return false;

    switch (userRole) {
      case 'admin':
        return true;
      case 'collector':
        return ['dashboard', 'users'].includes(tab);
      case 'member':
        return tab === 'dashboard';
      default:
        return false;
    }
  };

  return {
    userRole,
    roleLoading,
    error,
    canAccessTab,
  };
};