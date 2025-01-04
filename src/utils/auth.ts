import { supabase } from "@/integrations/supabase/client";

interface Member {
  id: string;
  member_number: string;
  auth_user_id?: string | null;
  email?: string | null;
  full_name?: string | null;
}

const normalizeMemberNumber = (memberNumber: string): string => {
  return memberNumber.trim().toUpperCase();
};

export async function verifyMember(memberNumber: string): Promise<Member> {
  console.log('Verifying member:', memberNumber);
  const normalized = normalizeMemberNumber(memberNumber);
  
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('member_number', normalized)
    .single();

  if (error) {
    console.error('Error verifying member:', error);
    throw new Error('Member not found. Please check your member number.');
  }

  console.log('Member found:', data);
  return data;
}

export async function signInMember(memberNumber: string) {
  console.log('Attempting to sign in member:', memberNumber);
  const normalized = normalizeMemberNumber(memberNumber);
  const email = `${normalized}@temp.pwaburton.org`;

  try {
    // Try to sign in
    const signInResponse = await supabase.auth.signInWithPassword({
      email,
      password: normalized,
    });

    if (signInResponse.error) {
      console.error('Sign in error:', signInResponse.error);
      
      // If invalid credentials, try to create account
      if (signInResponse.error.message.includes('Invalid login credentials')) {
        console.log('Invalid credentials, attempting to create account');
        const signUpResponse = await supabase.auth.signUp({
          email,
          password: normalized,
          options: {
            data: {
              member_number: normalized,
            }
          }
        });

        if (signUpResponse.error) {
          console.error('Sign up error:', signUpResponse.error);
          throw signUpResponse.error;
        }

        return signUpResponse.data.user;
      }
      
      throw signInResponse.error;
    }

    console.log('Sign in successful:', signInResponse.data.user?.id);
    return signInResponse.data.user;
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}