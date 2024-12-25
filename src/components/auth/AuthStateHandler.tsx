import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useAuthStateHandler = (setIsLoggedIn: (value: boolean) => void) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    console.log("Setting up auth state handler");
    let isSubscribed = true;
    
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log("Initial session check:", { session, error });
        
        if (!isSubscribed) return;

        if (error) {
          console.error("Session check error:", error);
          await handleAuthError(error);
          return;
        }
        
        if (session) {
          console.log("Active session found");
          setIsLoggedIn(true);
          await checkMemberStatus(session);
        } else {
          console.log("No active session found");
          setIsLoggedIn(false);
          navigate("/login");
        }
      } catch (error) {
        console.error("Session check failed:", error);
        if (!isSubscribed) return;
        await handleAuthError(error);
      }
    };

    const handleAuthError = async (error: any) => {
      console.error("Auth error occurred:", error);
      // Clear any stale session data
      await supabase.auth.signOut();
      setIsLoggedIn(false);
      navigate("/login");
    };

    const checkMemberStatus = async (session: any) => {
      if (!session?.user?.id) return;

      try {
        const { data: member, error } = await supabase
          .from('members')
          .select('first_time_login, profile_completed, password_changed')
          .eq('auth_user_id', session.user.id)
          .single();

        if (error) {
          console.error("Error checking member status:", error);
          return;
        }

        if (!member?.password_changed) {
          console.log("Password needs to be changed");
          navigate("/change-password");
          return;
        }

        if (member?.first_time_login || !member?.profile_completed) {
          console.log("Profile needs completion");
          navigate("/admin/profile");
          toast({
            title: "Welcome!",
            description: "Please complete your profile information.",
          });
          return;
        }
      } catch (error) {
        console.error("Error in checkMemberStatus:", error);
      }
    };

    // Initial session check
    checkSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", { event, session });
      
      if (!isSubscribed) return;

      switch (event) {
        case "SIGNED_IN":
          if (session) {
            console.log("Sign in event detected");
            setIsLoggedIn(true);
            await checkMemberStatus(session);
          }
          break;
          
        case "SIGNED_OUT":
          console.log("User signed out");
          setIsLoggedIn(false);
          navigate("/login");
          break;
          
        case "TOKEN_REFRESHED":
          console.log("Token refreshed successfully");
          if (session) {
            setIsLoggedIn(true);
            await checkMemberStatus(session);
          }
          break;

        case "INITIAL_SESSION":
          console.log("Initial session:", session);
          setIsLoggedIn(!!session);
          if (session) {
            await checkMemberStatus(session);
          }
          break;
      }
    });

    return () => {
      console.log("Cleaning up auth subscription");
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, [navigate, setIsLoggedIn, toast]);
};