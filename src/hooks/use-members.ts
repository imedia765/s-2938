import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ITEMS_PER_PAGE = 20;

export const useMembers = (page: number, searchTerm: string = "") => {
  return useQuery({
    queryKey: ['members', page, searchTerm],
    queryFn: async () => {
      try {
        // Verify session before making the query
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          throw new Error("Authentication required");
        }

        let query = supabase
          .from('members')
          .select('*', { count: 'exact' });

        if (searchTerm) {
          query = query.or(`full_name.ilike.%${searchTerm}%,member_number.ilike.%${searchTerm}%`);
        }

        const { data, error, count } = await query
          .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        return {
          members: data || [],
          totalCount: count || 0,
        };
      } catch (error) {
        console.error('Error fetching members:', error);
        throw error;
      }
    },
    retry: 1,
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: false,
  });
};