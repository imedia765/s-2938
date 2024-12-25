export interface TicketResponse {
  id: string;
  response: string;
  created_at: string;
  updated_at: string;
  responder_id: string | null;
  ticket_id: string | null;
  responder?: {
    email?: string;
    full_name?: string;
  };
  // Backwards compatibility fields
  message?: string;
  date?: string;
  isAdmin?: boolean;
}

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: string | null;
  priority: string | null;
  created_at: string;
  updated_at: string;
  member_id: string | null;
  member?: {
    full_name: string;
  } | null;
  ticket_responses?: TicketResponse[];
  message?: string;
  date?: string;
}