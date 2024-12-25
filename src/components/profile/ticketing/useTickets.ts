import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Ticket } from "../types/ticket";

export function useTickets() {
  return useQuery({
    queryKey: ['support-tickets'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const memberNumber = session.user.user_metadata?.member_number;
      
      if (!memberNumber) {
        console.log('No member number found in session');
        return [];
      }

      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('id')
        .eq('member_number', memberNumber)
        .maybeSingle();

      if (memberError) {
        console.error('Error fetching member:', memberError);
        return [];
      }

      if (!member) {
        console.log('No member found for number:', memberNumber);
        return [];
      }

      const { data: tickets, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          responses:ticket_responses (
            *,
            responder:profiles (
              full_name,
              email
            )
          )
        `)
        .eq('member_id', member.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tickets:', error);
        return [];
      }

      return tickets as Ticket[];
    }
  });
}