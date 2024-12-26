import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { CreateTicketDialog } from "./CreateTicketDialog";
import { TicketList } from "./ticketing/TicketList";
import { useTickets } from "./ticketing/useTickets";
import { supabase } from "@/integrations/supabase/client";
import { Ticket } from "./types";

export function TicketingSection() {
  const { toast } = useToast();
  const [newTicket, setNewTicket] = useState({ subject: "", message: "" });
  const [response, setResponse] = useState("");
  const { data: tickets = [], refetch: refetchTickets } = useTickets();

  const handleCreateTicket = async () => {
    if (!newTicket.subject || !newTicket.message) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const memberNumber = session.user.user_metadata?.member_number;
    
    if (!memberNumber) {
      console.log('No member number found in session');
      return;
    }

    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id')
      .eq('member_number', memberNumber)
      .maybeSingle();

    if (memberError) {
      console.error('Error fetching member:', memberError);
      return;
    }

    const { error } = await supabase
      .from('support_tickets')
      .insert({
        subject: newTicket.subject,
        description: newTicket.message,
        member_id: member?.id,
        status: "open",
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create ticket",
        variant: "destructive",
      });
      return;
    }

    setNewTicket({ subject: "", message: "" });
    refetchTickets();
    toast({
      title: "Success",
      description: "Ticket created successfully",
    });
  };

  const handleAddResponse = async () => {
    if (!response) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from('ticket_responses')
      .insert({
        response,
        ticket_id: tickets[0]?.id,
        responder_id: session.user.id
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add response",
        variant: "destructive",
      });
      return;
    }

    setResponse("");
    refetchTickets();
    toast({
      title: "Success",
      description: "Response added successfully",
    });
  };

  return (
    <div className="space-y-6">
      <CreateTicketDialog
        newTicket={newTicket}
        setNewTicket={setNewTicket}
        handleCreateTicket={handleCreateTicket}
      />
      <TicketList
        tickets={tickets as Ticket[]}
        response={response}
        setResponse={setResponse}
        handleAddResponse={handleAddResponse}
      />
    </div>
  );
}