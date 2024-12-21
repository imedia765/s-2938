import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserSearch } from "./UserSearch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface Member {
  id: string;
  full_name: string;
  member_number: string;
  password_changed: boolean;
  email: string | null;
}

export function UserManagementSection() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: members, isLoading } = useQuery({
    queryKey: ['members', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,member_number.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching members:', error);
        throw error;
      }

      return data as Member[];
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Member Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <UserSearch 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : members?.length ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Password Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>{member.member_number}</TableCell>
                      <TableCell>{member.full_name}</TableCell>
                      <TableCell>{member.email || 'Not set'}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={member.password_changed ? "success" : "destructive"}
                        >
                          {member.password_changed ? 'Updated' : 'Not Updated'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No members found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}