import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useLoginState = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let isSubscribed = true;

    const checkSession = async () => {
      try {
        console.log("Checking for existing session...");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session check error:", sessionError);
          return;
        }

        if (!isSubscribed) return;

        if (session?.user) {
          console.log("Active session found, redirecting...");
          navigate("/admin/profile");
        } else {
          console.log("No active session found");
        }
      } catch (error) {
        console.error("Session check failed:", error);
        // Clear any stale session data
        await cleanupSession();
      }
    };

    const cleanupSession = async () => {
      if (!isSubscribed) return;
      
      console.log("Cleaning up session data...");
      try {
        await supabase.auth.signOut();
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('supabase.auth.refreshToken');
      } catch (error) {
        console.error("Error during session cleanup:", error);
      }
    };

    checkSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isSubscribed) return;
      
      console.log("Auth state changed:", event, !!session);
      
      if (event === 'SIGNED_IN' && session) {
        navigate("/admin/profile");
      }
    });

    return () => {
      console.log("Cleaning up login state effect");
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  return {
    isLoading,
    setIsLoading,
    memberId,
    setMemberId,
    password,
    setPassword,
  };
};