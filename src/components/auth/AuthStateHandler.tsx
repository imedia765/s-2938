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
        // First check if we have a valid session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log("Initial session check:", { session, sessionError });
        
        if (!isSubscribed) return;

        if (sessionError) {
          console.error("Session check error:", sessionError);
          await handleAuthError(sessionError);
          return;
        }

        if (!session) {
          console.log("No active session found");
          setIsLoggedIn(false);
          navigate("/login");
          return;
        }

        // Verify the session is still valid
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error("User verification failed:", userError);
          await handleAuthError(userError || new Error("User not found"));
          return;
        }

        console.log("Active session found for user:", user.id);
        setIsLoggedIn(true);
        await checkMemberStatus(session);
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
      
      // Only navigate if the error is auth-related
      if (error.message?.includes('session') || error.message?.includes('auth')) {
        navigate("/login");
        toast({
          title: "Session Expired",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
      }
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

        case "USER_UPDATED":
          console.log("User data updated");
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