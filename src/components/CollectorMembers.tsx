import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useToast } from "@/hooks/use-toast";
import { Member } from "@/types/member";
import { Loader2 } from "lucide-react";
import MembersList from './MembersList';

const CollectorMembers = ({ collectorName }: { collectorName: string }) => {
  const { userRole, roleLoading } = useRoleAccess();
  const { toast } = useToast();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    console.log('CollectorMembers component mounted for collector:', collectorName);
    
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log('Current user ID:', session.user.id);
        console.log('User metadata:', session.user.user_metadata);
        setCurrentUserId(session.user.id);
      } else {
        console.log('No active session found');
      }
    };

    getCurrentUser();
  }, [collectorName]);

  const { data: membersData, isLoading: membersLoading, error } = useQuery({
    queryKey: ['collectorMembers', collectorName, userRole],
    queryFn: async () => {
      console.log('Starting members query with:', {
        collectorName,
        userRole,
        currentUserId
      });

      if (roleLoading) {
        console.log('Role still loading...');
        return [];
      }

      if (!userRole) {
        console.log('No user role found');
        return [];
      }

      console.log('User role:', userRole);

      try {
        // Check if user is a collector
        if (userRole === 'collector') {
          console.log('Verifying collector profile...');
          const { data: collectorProfile, error: collectorError } = await supabase
            .from('members_collectors')
            .select('*')
            .eq('name', collectorName)
            .single();

          if (collectorError) {
            console.error('Error fetching collector profile:', collectorError);
            throw collectorError;
          }

          console.log('Found collector profile:', collectorProfile);
        }

        // Fetch members
        console.log('Executing members query for collector:', collectorName);
        const { data: members, error: membersError } = await supabase
          .from('members')
          .select('*')
          .eq('collector', collectorName)
          .order('member_number');

        if (membersError) {
          console.error('Error fetching members:', membersError);
          throw membersError;
        }

        console.log(`Found ${members?.length || 0} members for collector:`, collectorName);
        console.log('Members data:', members);

        return members as Member[];
      } catch (error: any) {
        console.error('Error in query function:', error);
        throw error;
      }
    },
    enabled: !!collectorName && !roleLoading && !!userRole,
  });

  useEffect(() => {
    if (error) {
      console.error('Query error:', error);
      toast({
        title: "Error loading members",
        description: error instanceof Error ? error.message : "Failed to load members",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  if (roleLoading || membersLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!membersData) {
    return <div className="text-center p-4">No members found</div>;
  }

  return <MembersList members={membersData} />;
};

export default CollectorMembers;