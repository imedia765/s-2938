import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

interface CollectorDisplayProps {
  assignedCollectorName: string;
  currentMemberNumber?: string;
}

export const CollectorDisplay = ({ assignedCollectorName, currentMemberNumber }: CollectorDisplayProps) => {
  return (
    <>
      <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg shadow-sm">
        <p className="text-lg text-white">
          Currently assigned to: {" "}
          <span className="font-semibold text-blue-300 text-xl">
            {assignedCollectorName}
          </span>
        </p>
      </div>
      {currentMemberNumber && (
        <Alert className="mt-3 bg-primary/10 border-primary/20">
          <InfoIcon className="h-5 w-5 text-blue-300" />
          <AlertDescription className="text-lg text-white">
            Your member number is: {" "}
            <span className="font-semibold text-blue-300 text-xl">
              {currentMemberNumber}
            </span>
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};