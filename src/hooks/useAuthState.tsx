import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useAuthState = () => {
  const [isSessionValid, setIsSessionValid] = useState(false);
  const [memberNumber, setMemberNumber] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let isSubscribed = true;

    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          console.error("Session check error:", sessionError);
          if (isSubscribed) {
            setIsSessionValid(false);
            setMemberNumber(null);
            navigate("/login");
          }
          return;
        }

        // Only make one request to get user data
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error("User verification failed:", userError);
          if (isSubscribed) {
            setIsSessionValid(false);
            setMemberNumber(null);
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
          setIsSessionValid(true);
          const memberNum = user.user_metadata?.member_number;
          setMemberNumber(memberNum);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        if (isSubscribed) {
          setIsSessionValid(false);
          setMemberNumber(null);
          navigate("/login");
        }
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    };

    // Initial check
    checkAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isSubscribed) return;

      if (!session) {
        setIsSessionValid(false);
        setMemberNumber(null);
        navigate("/login");
      } else {
        setIsSessionValid(true);
        const memberNum = session.user.user_metadata?.member_number;
        setMemberNumber(memberNum);
      }
    });

    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  return { isSessionValid, memberNumber, isLoading };
};