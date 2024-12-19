import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

interface MembershipSectionProps {
  onCollectorChange?: (collectorId: string) => void;
}

export const MembershipSection = ({ onCollectorChange }: MembershipSectionProps) => {
  const [collectors, setCollectors] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCollector, setSelectedCollector] = useState<string>("");

  useEffect(() => {
    const fetchCollectors = async () => {
      console.log("Fetching collectors...");
      const { data, error } = await supabase
        .from('collectors')
        .select('id, name')
        .eq('active', true)
        .order('name');

      if (error) {
        console.error("Error fetching collectors:", error);
        return;
      }

      console.log("Fetched collectors:", data);
      if (data && data.length > 0) {
        setCollectors(data);
        if (!selectedCollector) {
          setSelectedCollector(data[0].id);
          onCollectorChange?.(data[0].id);
        }
      } else {
        console.warn("No active collectors found in the database");
      }
    };

    fetchCollectors();
  }, []);

  const handleCollectorChange = (value: string) => {
    console.log("Selected collector:", value);
    setSelectedCollector(value);
    onCollectorChange?.(value);
  };

  return (
    <div className="space-y-6 bg-gray-900 p-6 rounded-lg">
      <h3 className="text-2xl font-semibold text-white">Membership Information</h3>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="collector" className="text-white">Select Collector</Label>
          <Select value={selectedCollector} onValueChange={handleCollectorChange}>
            <SelectTrigger id="collector" className="w-full bg-gray-800 text-white border-gray-700">
              <SelectValue placeholder="Select a collector" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {collectors.length === 0 ? (
                <SelectItem value="no-collectors" disabled>
                  No active collectors available
                </SelectItem>
              ) : (
                collectors.map((collector) => (
                  <SelectItem 
                    key={collector.id} 
                    value={collector.id}
                    className="text-white hover:bg-gray-700"
                  >
                    {collector.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <Alert className="bg-blue-900/20 border-blue-800">
          <InfoIcon className="h-5 w-5 text-blue-400" />
          <AlertDescription className="text-white">
            <h4 className="font-medium text-lg mb-2">Membership Fee Structure</h4>
            <ul className="space-y-1 text-gray-200">
              <li>Registration fee: £150</li>
              <li>Annual fee: £40 (collected £20 in January and £20 in June)</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="flex items-center space-x-2">
          <Checkbox id="giftAid" className="border-gray-600 data-[state=checked]:bg-blue-600" />
          <label htmlFor="giftAid" className="text-white">
            I am eligible for Gift Aid
          </label>
        </div>

        <div className="space-y-2">
          <div className="flex items-start space-x-2">
            <Checkbox 
              id="terms" 
              required 
              className="mt-1 border-gray-600 data-[state=checked]:bg-blue-600"
            />
            <label htmlFor="terms" className="text-sm text-gray-200">
              I/We Hereby confirm the above details provided are genuine and valid. I/We also understand
              that submitting an application or making payment does not obligate PWA Burton On Trent to
              grant Membership. Membership will only be approved once all criteria are met, Supporting
              documents presented, Payment made in Full and approval is informed by the Management of PWA
              Burton On Trent. I/We understand and agree that it is my/our duty and responsibility to
              notify PWA Burton On Trent of ALL changes in circumstance in relation to myself/ALL those
              under this Membership, at my/our earliest convenience.
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};