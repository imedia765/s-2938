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
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: normalized,
    });

    if (!signInError && signInData?.user) {
      console.log('Sign in successful:', signInData.user.id);
      return signInData.user;
    }

    console.error('Sign in error:', signInError);
    throw signInError;
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}