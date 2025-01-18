import { MoreVertical, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Database } from "@/integrations/supabase/types";

type UserRole = Database['public']['Enums']['app_role'];

interface RoleManagementDropdownProps {
  currentRoles: UserRole[];
  onRoleUpdate: (role: UserRole, action: 'add' | 'remove') => void;
  disabled?: boolean;
}

const RoleManagementDropdown = ({
  currentRoles,
  onRoleUpdate,
  disabled = false
}: RoleManagementDropdownProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          disabled={disabled}
          className="h-8 w-8 p-0"
        >
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Open role menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem
          onClick={() => onRoleUpdate('collector', currentRoles.includes('collector') ? 'remove' : 'add')}
        >
          <Shield className="mr-2 h-4 w-4" />
          {currentRoles.includes('collector') ? 'Remove Collector' : 'Add Collector'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default RoleManagementDropdown;