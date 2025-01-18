import { Search, Shield, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Database } from "@/integrations/supabase/types";

type UserRole = Database['public']['Enums']['app_role'];

interface RoleManagementHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedRole: UserRole | 'all';
  onRoleChange: (role: UserRole | 'all') => void;
  totalCount: number;
  filteredCount: number;
  isLoading?: boolean;
}

const RoleManagementHeader = ({
  searchTerm,
  onSearchChange,
  selectedRole,
  onRoleChange,
  totalCount,
  filteredCount,
  isLoading = false
}: RoleManagementHeaderProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-white">Role Management</h2>
          <p className="text-dashboard-muted mt-1">Manage user roles and permissions</p>
        </div>
        <div className="flex items-center gap-2">
          {isLoading ? (
            <Badge variant="outline" className="bg-dashboard-card">
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
              Loading...
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-dashboard-card text-dashboard-text">
              {filteredCount} / {totalCount} Users
            </Badge>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-dashboard-card border-dashboard-cardBorder"
          />
        </div>
        <Select
          value={selectedRole}
          onValueChange={(value) => onRoleChange(value as UserRole | 'all')}
        >
          <SelectTrigger className="w-[180px] bg-dashboard-card border-dashboard-cardBorder">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-dashboard-accent1" />
              All Roles
            </SelectItem>
            <SelectItem value="admin" className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-dashboard-accent1" />
              Admin
            </SelectItem>
            <SelectItem value="collector" className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-dashboard-accent2" />
              Collector
            </SelectItem>
            <SelectItem value="member" className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-dashboard-accent3" />
              Member
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default RoleManagementHeader;