export interface TicketResponse {
  id: string;
  response: string;
  created_at: string;
  updated_at: string;
  responder_id: string | null;
  ticket_id: string | null;
  responder?: {
    full_name: string;
    email: string;
  };
}

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: "open" | "closed" | "in_progress" | "resolved";
  priority: "high" | "medium" | "low" | null;
  created_at: string;
  updated_at: string;
  member_id: string | null;
  responses: TicketResponse[];
  message?: string;
  date?: string;
}