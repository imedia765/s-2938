import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { useAuthSession } from "@/hooks/useAuthSession";
import ProtectedRoutes from "@/components/routing/ProtectedRoutes";
import { useEnhancedRoleAccess } from "@/hooks/useEnhancedRoleAccess";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useMemo } from "react";
import { useNavigate, useLocation, Routes, Route } from "react-router-dom";
import Login from "@/pages/Login";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const { session, loading: sessionLoading } = useAuthSession();
  const { isLoading: rolesLoading, error: rolesError } = useEnhancedRoleAccess();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Memoize the loading state calculation
  const showLoading = useMemo(() => {
    const isLoading = (sessionLoading || (session && rolesLoading)) && location.pathname !== '/login';
    if (isLoading) {
      console.log('Loading state active:', {
        sessionLoading,
        rolesLoading,
        hasSession: !!session,
        pathname: location.pathname
      });
    }
    return isLoading;
  }, [sessionLoading, rolesLoading, session, location.pathname]);

  useEffect(() => {
    if (!sessionLoading) {
      if (!session && location.pathname !== '/login') {
        navigate('/login', { replace: true });
      } else if (session && location.pathname === '/login') {
        navigate('/', { replace: true });
      }
    }
  }, [session, sessionLoading, navigate, location.pathname]);

  useEffect(() => {
    if (session) {
      queryClient.invalidateQueries({ queryKey: ['userRoles'] });
    }
  }, [session]);

  if (rolesError) {
    console.error('Role loading error:', rolesError);
    toast({
      title: "Error loading roles",
      description: "There was a problem loading user roles. Please try again.",
      variant: "destructive",
    });
  }

  if (showLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dashboard-dark">
        <Loader2 className="w-8 h-8 animate-spin text-dashboard-accent1" />
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<ProtectedRoutes session={session} />} />
      </Routes>
      <Toaster />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;