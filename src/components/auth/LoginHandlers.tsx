import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export async function handleMemberIdLogin(memberId: string, password: string, navigate: ReturnType<typeof useNavigate>) {
  try {
    const cleanMemberId = memberId.toUpperCase().trim();
    console.log("Attempting login with member_number:", cleanMemberId);
    
    // First, authenticate the member using our secure function
    const { data: authData, error: authError } = await supabase
      .rpc('authenticate_member', {
        p_member_number: cleanMemberId
      });
    
    if (authError) {
      console.error("Member authentication failed:", authError);
      throw new Error("Invalid member ID");
    }

    if (!authData || authData.length === 0) {
      console.error("No member found with ID:", cleanMemberId);
      throw new Error("Invalid member ID");
    }

    const member = authData[0];
    console.log("Member authenticated:", member);

    // Verify the password matches the member number
    if (password !== cleanMemberId) {
      console.error("Password verification failed");
      throw new Error("Invalid credentials");
    }

    // Generate a valid email for Supabase auth
    const email = member.email || `${cleanMemberId.toLowerCase()}@temp.pwaburton.org`;

    // First try to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: cleanMemberId
    });

    // If sign in succeeds, we're done
    if (!signInError) {
      console.log("Login successful, redirecting to admin");
      navigate("/admin");
      return;
    }

    console.log("Sign in failed, attempting to create account");

    // If sign in fails, create the account
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email,
      password: cleanMemberId,
      options: {
        data: {
          member_number: cleanMemberId,
          full_name: member.full_name
        }
      }
    });

    if (signUpError) {
      console.error('Sign up failed:', signUpError);
      throw new Error("Account creation failed");
    }

    // Wait a moment for the database trigger to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Try signing in one more time
    const { data: finalSignInData, error: finalSignInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: cleanMemberId
    });

    if (finalSignInError) {
      console.error('Final sign in attempt failed:', finalSignInError);
      throw new Error("Login failed after account creation");
    }

    console.log("Login successful, redirecting to admin");
    navigate("/admin");

  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}