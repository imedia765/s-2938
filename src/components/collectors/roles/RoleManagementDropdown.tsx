import { Shield } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Database } from "@/integrations/supabase/types";

type UserRole = Database['public']['Enums']['app_role'];

interface RoleManagementDropdownProps {
  collector: {
    auth_user_id: string;
    roles: UserRole[];
  };
  onRoleUpdate: (role: UserRole, action: 'add' | 'remove') => void;
}

const RoleManagementDropdown = ({ collector, onRoleUpdate }: RoleManagementDropdownProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Shield className="w-4 h-4 mr-2" />
          Manage Roles
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          onClick={() => onRoleUpdate('collector', collector.roles.includes('collector') ? 'remove' : 'add')}
        >
          {collector.roles.includes('collector') ? 'Remove Collector Role' : 'Add Collector Role'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default RoleManagementDropdown;