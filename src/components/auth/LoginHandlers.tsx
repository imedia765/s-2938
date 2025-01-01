import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getMemberByMemberId } from "@/utils/memberAuth";

export async function handleMemberIdLogin(memberId: string, password: string, navigate: ReturnType<typeof useNavigate>) {
  try {
    const cleanMemberId = memberId.toUpperCase().trim();
    console.log("Attempting login with member_number:", cleanMemberId);
    
    // First, look up the member
    const member = await getMemberByMemberId(cleanMemberId);
    
    if (!member) {
      console.error("Member lookup failed - member not found:", { member_number: cleanMemberId });
      throw new Error("Invalid member ID");
    }

    console.log("Found member:", member);

    const email = `${cleanMemberId}@temp.pwaburton.org`;

    // If member doesn't have an auth account yet, create one
    if (!member.auth_user_id) {
      console.log("Member has no auth account, creating one");
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: cleanMemberId,
        options: {
          data: {
            member_number: cleanMemberId
          }
        }
      });

      if (signUpError) {
        console.error('Sign up failed:', signUpError);
        throw new Error("Failed to create account");
      }

      if (!signUpData?.user) {
        console.error('Sign up failed - no user data returned');
        throw new Error("Account creation failed");
      }

      // Update member record with auth user id
      const { error: updateError } = await supabase
        .from('members')
        .update({ 
          auth_user_id: signUpData.user.id,
          email_verified: true,
          email: email,
          profile_updated: true
        })
        .eq('member_number', cleanMemberId)
        .is('auth_user_id', null);

      if (updateError) {
        console.error('Error updating member record:', updateError);
        throw new Error("Failed to update member record");
      }
    }

    // Now attempt to sign in
    console.log("Attempting to sign in with credentials");
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
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