import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AccountSettingsSection } from "@/components/profile/AccountSettingsSection";
import { DocumentsSection } from "@/components/profile/DocumentsSection";
import { PaymentHistorySection } from "@/components/profile/PaymentHistorySection";
import { SupportSection } from "@/components/profile/SupportSection";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const [searchDate, setSearchDate] = useState("");
  const [searchAmount, setSearchAmount] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const [memberNumber, setMemberNumber] = useState<string | null>(null);
  const [isSessionValid, setIsSessionValid] = useState(false);

  // Check authentication and get member number
  useEffect(() => {
    let isSubscribed = true;

    const checkAuth = async () => {
      try {
        // First check if we have a valid session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session check error:", sessionError);
          if (isSubscribed) {
            setIsSessionValid(false);
            navigate("/login");
            toast({
              title: "Session Error",
              description: "Please log in again to continue.",
              variant: "destructive",
            });
          }
          return;
        }

        if (!session) {
          console.log("No active session found");
          if (isSubscribed) {
            setIsSessionValid(false);
            navigate("/login");
          }
          return;
        }

        // Verify the session is still valid
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error("User verification failed:", userError);
          if (isSubscribed) {
            setIsSessionValid(false);
            localStorage.removeItem('supabase.auth.token');
            navigate("/login");
            toast({
              title: "Session Expired",
              description: "Please log in again to continue.",
              variant: "destructive",
            });
          }
          return;
        }

        if (isSubscribed) {
          console.log("Session verified for user:", user.id);
          setIsSessionValid(true);
          const memberNum = user.user_metadata?.member_number;
          console.log("Member number from session:", memberNum);
          setMemberNumber(memberNum);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        if (isSubscribed) {
          setIsSessionValid(false);
          navigate("/login");
        }
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session);
      
      if (!isSubscribed) return;

      if (!session) {
        setIsSessionValid(false);
        navigate("/login");
      } else {
        setIsSessionValid(true);
        const memberNum = session.user.user_metadata?.member_number;
        console.log("Member number from auth change:", memberNum);
        setMemberNumber(memberNum);
      }
    });

    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

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

  if (!isSessionValid) {
    return null;
  }

  if (memberLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto p-6">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-6">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
        Member Profile
      </h1>

      <div className="space-y-6">
        <AccountSettingsSection memberData={memberData} />
        <DocumentsSection 
          documents={documents}
          documentTypes={documentTypes}
        />
        <PaymentHistorySection 
          memberId={memberData?.id || ''}
          searchDate={searchDate}
          searchAmount={searchAmount}
          onSearchDateChange={setSearchDate}
          onSearchAmountChange={setSearchAmount}
        />
        <SupportSection />
      </div>
    </div>
  );
}