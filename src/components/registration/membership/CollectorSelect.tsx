import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

interface CollectorSelectProps {
  collectors: Array<{ id: string; name: string }>;
  selectedCollector: string;
  onCollectorChange: (value: string) => void;
  nextMemberNumber?: string;
}

export const CollectorSelect = ({ 
  collectors, 
  selectedCollector, 
  onCollectorChange,
  nextMemberNumber 
}: CollectorSelectProps) => {
  return (
    <>
      <Select 
        value={selectedCollector} 
        onValueChange={onCollectorChange}
      >
        <SelectTrigger id="collector" className="w-full text-white bg-primary/10">
          <SelectValue placeholder="Select a collector" />
        </SelectTrigger>
        <SelectContent>
          {collectors.length === 0 ? (
            <SelectItem value="no-collectors" disabled>
              No active collectors available
            </SelectItem>
          ) : (
            collectors.map((collector) => (
              <SelectItem key={collector.id} value={collector.id}>
                {collector.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      {nextMemberNumber && (
        <Alert className="mt-3 bg-primary/10 border-primary/20">
          <InfoIcon className="h-5 w-5 text-blue-300" />
          <AlertDescription className="text-lg text-white">
            Your member number will be: {" "}
            <span className="font-semibold text-blue-300 text-xl">
              {nextMemberNumber}
            </span>
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};