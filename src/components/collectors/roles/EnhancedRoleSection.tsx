import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface EnhancedRoleSectionProps {
  collector: {
    enhanced_roles: Array<{
      role_name: string;
      is_active: boolean;
    }>;
  };
  onEnhancedRoleUpdate: (roleName: string, isActive: boolean) => void;
}

const EnhancedRoleSection = ({ collector, onEnhancedRoleUpdate }: EnhancedRoleSectionProps) => {
  return (
    <div className="space-y-2">
      {collector.enhanced_roles.map((role) => (
        <div key={role.role_name} className="flex items-center gap-2">
          <Switch
            checked={role.is_active}
            onCheckedChange={(checked) => onEnhancedRoleUpdate(role.role_name, checked)}
          />
          <Label>{role.role_name}</Label>
        </div>
      ))}
    </div>
  );
};

export default EnhancedRoleSection;