import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Icons } from "@/components/ui/icons";
import { supabase } from "@/integrations/supabase/client";
import { LoginTabs } from "@/components/auth/LoginTabs";
import { getMemberByMemberId, verifyMemberPassword } from "@/utils/memberAuth";

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log("Login component mounted - checking session");
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log("Session check result:", { session, error });
      if (session) {
        console.log("Active session found, redirecting to admin");
        navigate("/admin");
      }
    };
    
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", { event, session });
      if (event === "SIGNED_IN" && session) {
        console.log("Sign in event detected");
        handleSuccessfulLogin();
      } else if (event === "SIGNED_OUT") {
        setIsLoggedIn(false);
      }
    });

    return () => {
      console.log("Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSuccessfulLogin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;

      const { data: member, error } = await supabase
        .from('members')
        .select('password_changed')
        .eq('email', user.email)
        .maybeSingle(); // Use maybeSingle() instead of single()

      if (error) {
        console.error("Error checking password status:", error);
        // If there's an error, redirect to admin as fallback
        navigate("/admin");
        return;
      }

      // If member exists and hasn't changed password, redirect to change password
      if (member && !member.password_changed) {
        navigate("/change-password");
      } else {
        // If no member record or password already changed, go to admin
        navigate("/admin");
      }
    } catch (error) {
      console.error("Error in handleSuccessfulLogin:", error);
      // If there's an error, redirect to admin as fallback
      navigate("/admin");
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      setIsLoggedIn(true);
    } catch (error) {
      console.error("Email login error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "An error occurred during login",
        variant: "destructive",
      });
    }
  };

  const handleMemberIdSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    console.log("Member ID login attempt started");

    try {
      const formData = new FormData(e.currentTarget);
      const memberId = (formData.get("memberId") as string).trim().toUpperCase();
      const password = formData.get("memberPassword") as string;

      console.log("Looking up member with ID:", memberId);
      const member = await getMemberByMemberId(memberId);
      console.log("Member lookup result:", { member });

      if (!member || !member.email) {
        throw new Error("Member ID not found");
      }

      // Verify the password against the stored hash
      const isPasswordValid = await verifyMemberPassword(password, member.default_password_hash);
      if (!isPasswordValid) {
        throw new Error("Invalid password");
      }

      console.log("Attempting login with member's email");
      const { data, error } = await supabase.auth.signInWithPassword({
        email: member.email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
    } catch (error) {
      console.error("Member ID login error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid member ID or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    console.log("Google login attempt started");
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + "/admin",
        },
      });

      console.log("Google login response:", { data, error });
      if (error) throw error;
      
      toast({
        title: "Redirecting to Google",
        description: "Please wait while we redirect you to Google sign-in...",
      });
    } catch (error) {
      console.error("Google login error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "An error occurred during Google login",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoggedIn ? (
            <Button onClick={() => supabase.auth.signOut()} className="w-full">
              Logout
            </Button>
          ) : (
            <>
              <Button 
                variant="outline" 
                className="w-full mb-6 h-12 text-lg bg-white hover:bg-gray-50 border-2 shadow-sm text-gray-700 font-medium" 
                onClick={handleGoogleLogin}
              >
                <Icons.google className="mr-2 h-5 w-5 [&>path]:fill-[#4285F4]" />
                Continue with Google
              </Button>
              
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <LoginTabs 
                onEmailSubmit={handleEmailSubmit}
                onMemberIdSubmit={handleMemberIdSubmit}
              />

              <div className="text-center text-sm mt-6">
                Don't have an account?{" "}
                <Link to="/register" className="text-primary hover:underline">
                  Register here
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};