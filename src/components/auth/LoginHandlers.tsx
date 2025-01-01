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

    // If member exists and password matches, sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: cleanMemberId
    });

    if (signInError) {
      // If sign in fails, try to create the account first
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
        throw new Error("Login failed");
      }

      // Try signing in again after creating the account
      const { data: retrySignInData, error: retrySignInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: cleanMemberId
      });

      if (retrySignInError) {
        console.error('Sign in failed after account creation:', retrySignInError);
        throw new Error("Login failed");
      }
    }

    console.log("Login successful, redirecting to admin");
    navigate("/admin");

  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}