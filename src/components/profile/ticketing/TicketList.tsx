import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TicketResponseDialog } from "../TicketResponseDialog";
import { Ticket, TicketResponse } from "../types/ticket";

interface TicketListProps {
  tickets: Ticket[];
  response: string;
  setResponse: (response: string) => void;
  handleAddResponse: () => void;
}

export function TicketList({ tickets, response, setResponse, handleAddResponse }: TicketListProps) {
  const mapTicketResponses = (responses: TicketResponse[]): TicketResponse[] => {
    return responses.map(resp => ({
      id: resp.id,
      response: resp.response,
      created_at: resp.created_at,
      updated_at: resp.updated_at,
      responder_id: resp.responder_id,
      ticket_id: resp.ticket_id,
      responder: resp.responder
    }));
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticket ID</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow key={ticket.id}>
              <TableCell>{ticket.id}</TableCell>
              <TableCell>{ticket.subject}</TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    ticket.status === "open"
                      ? "bg-green-100 text-green-800"
                      : ticket.status === "in_progress"
                      ? "bg-yellow-100 text-yellow-800"
                      : ticket.status === "resolved"
                      ? "bg-blue-100 text-blue-800"
                      : ticket.status === "closed"
                      ? "bg-gray-100 text-gray-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {ticket.status}
                </span>
              </TableCell>
              <TableCell>
                {new Date(ticket.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <TicketResponseDialog
                  ticket={{
                    ...ticket,
                    message: ticket.description || "",
                    date: ticket.created_at || new Date().toISOString(),
                    responses: mapTicketResponses(ticket.responses || [])
                  }}
                  response={response}
                  setResponse={setResponse}
                  handleAddResponse={handleAddResponse}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}