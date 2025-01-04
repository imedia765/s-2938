import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import Index from './pages/Index';
import Login from './pages/Login';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";

function AuthWrapper() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    let isSubscribed = true;

    const checkSession = async () => {
      try {
        // First check if we have a valid session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error checking session:', sessionError);
          await supabase.auth.signOut();
          navigate('/login');
          return;
        }

        if (!session) {
          console.log('No session found, redirecting to login');
          navigate('/login');
          return;
        }

        // Verify the session is still valid
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('Error verifying user:', userError);
          // Clear the invalid session
          await supabase.auth.signOut();
          navigate('/login');
          return;
        }

        if (!user) {
          console.log('No user found, clearing session');
          await supabase.auth.signOut();
          navigate('/login');
          return;
        }

        console.log('Valid session found:', user.id);
        queryClient.invalidateQueries();
      } catch (error) {
        console.error('Session check failed:', error);
        // Clear any invalid session state
        await supabase.auth.signOut();
        navigate('/login');
      }
    };

    // Initial session check
    checkSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isSubscribed) return;
      
      console.log('Auth state changed:', event, session?.user?.id);
      
      switch (event) {
        case 'SIGNED_IN':
          console.log('User signed in:', session?.user?.id);
          queryClient.invalidateQueries();
          navigate('/');
          break;
          
        case 'SIGNED_OUT':
          console.log('User signed out');
          queryClient.clear(); // Clear all queries on sign out
          navigate('/login');
          toast({
            title: "Signed out",
            description: "You have been signed out successfully.",
          });
          break;
          
        case 'TOKEN_REFRESHED':
          console.log('Token refreshed');
          queryClient.invalidateQueries();
          break;
          
        case 'USER_UPDATED':
          console.log('User updated');
          queryClient.invalidateQueries();
          break;
          
        default:
          if (!session) {
            console.log('No session in auth change, redirecting to login');
            navigate('/login');
          }
      }
    });

    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, [navigate, queryClient, toast]);

  return null;
}

function App() {
  return (
    <Router>
      <AuthWrapper />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Index />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;