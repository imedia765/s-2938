export interface Response {
  id: string;
  message: string;
  date: string;
  isAdmin: boolean;
}

export interface Ticket {
  id: string;
  subject: string;
  message: string;
  description?: string;
  phoneNumber?: string;
  status: "open" | "closed" | "in_progress" | "resolved";
  date: string;
  created_at?: string;
  responses: Response[];
  ticket_responses?: any[]; // For backward compatibility
}