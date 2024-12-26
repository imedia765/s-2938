import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuthState } from "@/hooks/useAuthState";
import { ProfileLayout, ProfileSkeleton } from "@/components/profile/ProfileLayout";

export default function Profile() {
  const [searchDate, setSearchDate] = useState("");
  const [searchAmount, setSearchAmount] = useState("");
  const { toast } = useToast();
  const { isSessionValid, memberNumber, isLoading: authLoading } = useAuthState();

  // Mock document types (this could be moved to a constants file)
  const documentTypes = [
    { type: 'Identification', description: 'Valid ID document (Passport, Driving License)' },
    { type: 'Address Proof', description: 'Recent utility bill or bank statement' },
    { type: 'Medical Certificate', description: 'Recent medical certificate if applicable' },
    { type: 'Marriage Certificate', description: 'Marriage certificate if applicable' },
  ];

  // Mock documents (you might want to add a documents table to Supabase later)
  const documents = [
    { name: 'ID Document.pdf', uploadDate: '2024-03-01', type: 'Identification' },
    { name: 'Proof of Address.pdf', uploadDate: '2024-02-15', type: 'Address Proof' },
  ];

  // Fetch member profile data
  const { data: memberData, isLoading: memberLoading } = useQuery({
    queryKey: ['member-profile', memberNumber],
    enabled: !!memberNumber && isSessionValid,
    queryFn: async () => {
      console.log('Fetching profile for member number:', memberNumber);
      
      try {
        const { data, error } = await supabase
          .from('members')
          .select(`
            *,
            family_members (
              id,
              name,
              relationship,
              date_of_birth,
              gender
            )
          `)
          .eq('member_number', memberNumber)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error);
          toast({
            title: "Error fetching profile",
            description: error.message,
            variant: "destructive",
          });
          return null;
        }

        if (!data) {
          console.log('No profile found for member number:', memberNumber);
          toast({
            title: "Profile not found",
            description: "No member profile found for this member number.",
            variant: "destructive",
          });
          return null;
        }

        console.log('Found profile:', data);
        return data;
      } catch (error) {
        console.error('Error in profile fetch:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred while fetching your profile.",
          variant: "destructive",
        });
        return null;
      }
    },
  });

  if (!isSessionValid || authLoading) {
    return null;
  }

  if (memberLoading) {
    return <ProfileSkeleton />;
  }

  return (
    <ProfileLayout
      memberData={memberData}
      documents={documents}
      documentTypes={documentTypes}
      searchDate={searchDate}
      searchAmount={searchAmount}
      onSearchDateChange={setSearchDate}
      onSearchAmountChange={setSearchAmount}
    />
  );
}