import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

export const useLoginHandlers = (setIsLoggedIn: (value: boolean) => void) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      // First check if this is a valid member email
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('id, email_verified, profile_updated, password_changed')
        .eq('email', email)
        .maybeSingle();

      if (memberError) {
        console.error('Member check error:', memberError);
        throw new Error("Error checking member status");
      }

      if (!memberData) {
        throw new Error("No member found with this email address. Please check your credentials or contact support.");
      }

      // Attempt to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        if (error.message.includes('Invalid login credentials')) {
          throw new Error("Invalid email or password. Please try again.");
        }
        throw error;
      }

      console.log("Login successful:", data);
      
      // Check if password needs to be changed
      if (!memberData.password_changed) {
        navigate("/change-password");
        return;
      }

      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      setIsLoggedIn(true);
      navigate("/admin/profile");
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
    const formData = new FormData(e.currentTarget);
    const memberId = (formData.get("memberId") as string).toUpperCase().trim();
    const password = formData.get("memberPassword") as string;

    try {
      // First, get the member details
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('email, default_password_hash, password_changed')
        .eq('member_number', memberId)
        .maybeSingle();

      if (memberError) {
        console.error('Member lookup error:', memberError);
        throw new Error("Error checking member status");
      }

      if (!member) {
        throw new Error("Invalid Member ID. Please check your credentials and try again.");
      }

      if (!member.email) {
        throw new Error("No email associated with this Member ID. Please contact support.");
      }

      // Attempt to sign in with the email
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: member.email,
        password: password,
      });

      if (signInError) {
        console.error('Sign in error:', signInError);
        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error("Invalid Member ID or password. Please try again.");
        }
        throw signInError;
      }

      // Check if password needs to be changed
      if (!member.password_changed) {
        navigate("/change-password");
        return;
      }

      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      setIsLoggedIn(true);
      navigate("/admin/profile");
    } catch (error) {
      console.error("Member ID login error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid Member ID or password",
        variant: "destructive",
      });
    }
  };

  const handleGoogleLogin = async () => {
    console.log("Google login attempt started");
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + "/admin/profile",
        },
      });

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

  return {
    handleEmailSubmit,
    handleMemberIdSubmit,
    handleGoogleLogin,
  };
};