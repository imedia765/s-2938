import { useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

export function useAuthSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      setLoading(true);
      console.log('Starting sign out process...');
      
      // First clear all queries and cache
      await queryClient.resetQueries();
      await queryClient.clear();
      console.log('Query cache cleared');

      // Clear local storage
      localStorage.clear();
      console.log('Local storage cleared');

      // Reset session state before signing out
      setSession(null);
      console.log('Session state reset');

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log('Signed out from Supabase');

      // Navigate to login page
      window.location.href = '/login';
      console.log('Redirecting to login page');
      
    } catch (error: any) {
      console.error('Error during sign out:', error);
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeSession = async () => {
      try {
        setLoading(true);
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (mounted) {
          setSession(currentSession);
          if (currentSession?.user) {
            console.log('Session initialized for user:', currentSession.user.id);
          }
        }
      } catch (error: any) {
        console.error('Session initialization error:', error);
        if (mounted) {
          setSession(null);
          window.location.href = '/login';
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;

      console.log('Auth state changed:', event, currentSession?.user?.id);
      
      if (event === 'SIGNED_OUT') {
        // Clear everything on sign out
        await queryClient.resetQueries();
        await queryClient.clear();
        localStorage.clear();
        setSession(null);
        window.location.href = '/login';
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(currentSession);
        await queryClient.invalidateQueries();
      }
      
      setLoading(false);
    });

    initializeSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient, toast, navigate]);

  return { session, loading, handleSignOut };
}