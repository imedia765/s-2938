import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

export const useLoginHandler = (setIsLoading: (value: boolean) => void) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (memberId: string, password: string) => {
    const cleanMemberId = memberId.toUpperCase().trim();
    console.log("Starting login process for member ID:", cleanMemberId);

    try {
      setIsLoading(true);
      
      // First clear any existing session
      await supabase.auth.signOut();
      
      // Get member details
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('id, email, password_changed, member_number, auth_user_id')
        .eq('member_number', cleanMemberId)
        .maybeSingle();

      if (memberError) {
        console.error("Member lookup error:", memberError);
        throw new Error("Error checking member status");
      }

      if (!member) {
        console.error("No member found with ID:", cleanMemberId);
        throw new Error("Invalid Member ID. Please check your credentials.");
      }

      console.log("Member found:", { memberId: member.member_number, hasAuthId: !!member.auth_user_id });

      // Use temporary email for login
      const tempEmail = `${cleanMemberId.toLowerCase()}@temp.pwaburton.org`;
      console.log("Attempting login with temp email:", tempEmail);

      // Attempt to sign in
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: tempEmail,
        password: password,
      });

      if (signInError) {
        console.error('Sign in error:', signInError);
        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error("Invalid Member ID or password. Please try again.");
        }
        throw signInError;
      }

      if (!data.session) {
        console.error("No session created after successful login");
        throw new Error("Failed to create session");
      }

      console.log("Login successful, session created:", !!data.session);

      // Update member if needed
      if (data.user && member.id && !member.auth_user_id) {
        console.log("Updating member with auth user ID");
        const { error: updateError } = await supabase
          .from('members')
          .update({ 
            auth_user_id: data.user.id,
            email_verified: true,
            profile_updated: true
          })
          .eq('id', member.id);

        if (updateError) {
          console.error("Error updating member:", updateError);
        }
      }

      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      if (!member.password_changed) {
        console.log("Redirecting to change password page");
        navigate("/change-password");
      } else {
        console.log("Redirecting to admin profile page");
        navigate("/admin/profile");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
      // Clear any partial session state
      await supabase.auth.signOut();
    } finally {
      setIsLoading(false);
    }
  };

  return { handleLogin };
};