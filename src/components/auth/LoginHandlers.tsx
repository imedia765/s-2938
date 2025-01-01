import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export async function handleMemberIdLogin(memberId: string, password: string, navigate: ReturnType<typeof useNavigate>) {
  try {
    const cleanMemberId = memberId.toUpperCase().trim();
    console.log("Attempting login with member_number:", cleanMemberId);
    
    // First, authenticate the member using our secure function
    const { data: member, error: lookupError } = await supabase
      .rpc('authenticate_member', {
        p_member_number: cleanMemberId
      })
      .single();
    
    if (lookupError || !member) {
      console.error("Member authentication failed:", lookupError);
      throw new Error("Invalid member ID");
    }

    // Verify the password matches the member number
    if (password !== cleanMemberId) {
      console.error("Password verification failed");
      throw new Error("Invalid credentials");
    }

    // If member exists and password matches, sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: `${cleanMemberId}@temp.pwaburton.org`,
      password: cleanMemberId
    });

    if (signInError) {
      console.error('Sign in failed:', signInError);
      throw new Error("Invalid credentials");
    }

    if (!signInData?.user) {
      console.error('Sign in failed - no user data returned');
      throw new Error("Login failed");
    }

    console.log("Login successful, redirecting to admin");
    navigate("/admin");

  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}