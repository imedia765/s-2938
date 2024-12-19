import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";
import { CollectorDisplay } from "./membership/CollectorDisplay";
import { CollectorSelect } from "./membership/CollectorSelect";
import { MembershipTerms } from "./membership/MembershipTerms";

interface MembershipSectionProps {
  onCollectorChange?: (collectorId: string) => void;
}

export const MembershipSection = ({ onCollectorChange }: MembershipSectionProps) => {
  const [collectors, setCollectors] = useState<Array<{ id: string; name: string; prefix: string; number: string }>>([]);
  const [selectedCollector, setSelectedCollector] = useState<string>("");
  const [assignedCollectorName, setAssignedCollectorName] = useState<string>("");
  const [nextMemberNumber, setNextMemberNumber] = useState<string>("");
  const [currentMemberNumber, setCurrentMemberNumber] = useState<string>("");
  const location = useLocation();
  const memberId = location.state?.memberId;

  const calculateNextMemberNumber = async (collectorId: string) => {
    console.log("Calculating next member number for collector:", collectorId);
    const { data: collector } = await supabase
      .from('collectors')
      .select('prefix, number')
      .eq('id', collectorId)
      .single();

    if (collector) {
      console.log("Found collector:", collector);
      const { data: lastMember } = await supabase
        .from('members')
        .select('member_number')
        .like('member_number', `${collector.prefix}${collector.number}%`)
        .order('member_number', { ascending: false })
        .limit(1);

      let sequence = 1;
      if (lastMember && lastMember.length > 0) {
        console.log("Last member number:", lastMember[0].member_number);
        const lastSequence = parseInt(lastMember[0].member_number.substring((collector.prefix + collector.number).length)) || 0;
        sequence = lastSequence + 1;
      }

      const nextNumber = `${collector.prefix}${collector.number}${String(sequence).padStart(3, '0')}`;
      console.log("Calculated next member number:", nextNumber);
      setNextMemberNumber(nextNumber);
    }
  };

  useEffect(() => {
    const fetchCollectors = async () => {
      console.log("Fetching collectors...");
      try {
        if (memberId) {
          console.log("Fetching member data for ID:", memberId);
          const { data: memberData, error: memberError } = await supabase
            .from('members')
            .select('collector_id, collector, member_number')
            .eq('member_number', memberId)
            .single();

          if (memberError) {
            console.error("Error fetching member data:", memberError);
          } else if (memberData) {
            console.log("Found member data:", memberData);
            setCurrentMemberNumber(memberData.member_number);
            if (memberData.collector) {
              setAssignedCollectorName(memberData.collector);
              if (memberData.collector_id) {
                setSelectedCollector(memberData.collector_id);
                onCollectorChange?.(memberData.collector_id);
              }
              return;
            }
          }
        }

        const { data: collectorsData, error: collectorsError } = await supabase
          .from('collectors')
          .select('id, name, prefix, number')
          .eq('active', true)
          .order('name');

        if (collectorsError) {
          console.error("Error fetching collectors:", collectorsError);
          return;
        }

        console.log("Fetched collectors:", collectorsData);
        
        if (collectorsData && collectorsData.length > 0) {
          setCollectors(collectorsData);
          
          if (!selectedCollector) {
            console.log("Setting default collector:", collectorsData[0].id);
            setSelectedCollector(collectorsData[0].id);
            onCollectorChange?.(collectorsData[0].id);
            calculateNextMemberNumber(collectorsData[0].id);
          }
        } else {
          console.warn("No active collectors found in the database");
        }
      } catch (error) {
        console.error("Unexpected error during collector fetch:", error);
      }
    };

    fetchCollectors();
  }, [memberId, onCollectorChange]);

  const handleCollectorChange = (value: string) => {
    console.log("Selected collector:", value);
    setSelectedCollector(value);
    onCollectorChange?.(value);
    calculateNextMemberNumber(value);
  };

  return (
    <div className="space-y-4 bg-gray-900 p-6 rounded-lg">
      <h3 className="text-lg font-semibold text-white">Membership Information</h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="collector" className="text-lg text-white">Select Collector</Label>
          {memberId && assignedCollectorName ? (
            <CollectorDisplay 
              assignedCollectorName={assignedCollectorName}
              currentMemberNumber={currentMemberNumber}
            />
          ) : (
            <CollectorSelect
              collectors={collectors}
              selectedCollector={selectedCollector}
              onCollectorChange={handleCollectorChange}
              nextMemberNumber={nextMemberNumber}
            />
          )}
        </div>

        <MembershipTerms />
      </div>
    </div>
  );
};
