import { useState, useEffect } from "react";
import { supabase } from "../integrations/supabase/client";
import { useToast } from "./ui/use-toast";
import { ThemeToggle } from "./ThemeToggle";
import { NavLogo } from "./navigation/NavLogo";
import { NavLinks } from "./navigation/NavLinks";
import { AuthButtons } from "./navigation/AuthButtons";
import { MobileNav } from "./navigation/MobileNav";

export function NavigationMenu() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let isSubscribed = true;

    const checkSession = async () => {
      try {
        // Clear any stale session data first
        const currentSession = await supabase.auth.getSession();
        if (currentSession.error) {
          console.error("Initial session check error:", currentSession.error);
          await cleanupSession();
          return;
        }

        // Only update state if component is still mounted
        if (isSubscribed) {
          setIsLoggedIn(!!currentSession.data.session);
        }
      } catch (error) {
        console.error("Session check failed:", error);
        await cleanupSession();
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    const cleanupSession = async () => {
      if (!isSubscribed) return;
      
      setIsLoggedIn(false);
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('supabase.auth.refreshToken');
      
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch (error) {
        console.error("Error during local signout:", error);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isSubscribed) return;
      
      console.log("Auth state changed:", event, !!session);
      
      switch (event) {
        case "SIGNED_IN":
          setIsLoggedIn(true);
          toast({
            title: "Signed in successfully",
            description: "Welcome back!",
            duration: 3000,
          });
          break;
          
        case "SIGNED_OUT":
          await cleanupSession();
          toast({
            title: "Logged out successfully",
            description: "Come back soon!",
            duration: 3000,
          });
          break;
          
        case "TOKEN_REFRESHED":
          if (session) {
            setIsLoggedIn(true);
          } else {
            await cleanupSession();
          }
          break;

        case "INITIAL_SESSION":
          setIsLoggedIn(!!session);
          break;
      }
    });

    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, [toast]);

  const handleLogout = async () => {
    try {
      setLoading(true);
      
      // First check if we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.log("No active session found, cleaning up state");
        await cleanupLocalState();
        return;
      }

      // Attempt to sign out globally
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error("Logout error:", error);
        // If we get a session_not_found error, just clean up local state
        if (error.message?.includes('session_not_found')) {
          await cleanupLocalState();
          return;
        }
        throw error;
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Ensure we clean up local state even on error
      await cleanupLocalState();
      toast({
        title: "Logout failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const cleanupLocalState = async () => {
    setIsLoggedIn(false);
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('supabase.auth.refreshToken');
    
    try {
      await supabase.auth.signOut({ scope: 'local' });
      toast({
        title: "Session expired",
        description: "You have been logged out due to inactivity",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error during local cleanup:", error);
    }
  };

  if (loading) {
    return (
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-14 items-center justify-between">
          <NavLogo />
          <ThemeToggle />
        </div>
      </nav>
    );
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center space-x-4">
          <NavLogo />
          <NavLinks />
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-2">
          <AuthButtons isLoggedIn={isLoggedIn} handleLogout={handleLogout} />
          <ThemeToggle />
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center space-x-2">
          <ThemeToggle />
          <MobileNav isLoggedIn={isLoggedIn} handleLogout={handleLogout} />
        </div>
      </div>
    </nav>
  );
}