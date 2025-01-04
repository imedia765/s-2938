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
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: normalized,
    });

    if (error) {
      console.error('Sign in error:', error);
      return null;
    }

    if (!data?.user) {
      console.log('No user data returned from sign in');
      return null;
    }

    console.log('Sign in successful:', data.user.id);
    return data.user;
  } catch (error) {
    console.error('Sign in error:', error);
    return null;
  }
}

export async function createAuthAccount(memberNumber: string) {
  console.log('Creating auth account for member:', memberNumber);
  const normalized = normalizeMemberNumber(memberNumber);
  const email = `${normalized}@temp.pwaburton.org`;

  try {
    // First check if account exists by trying to sign in
    const existingUser = await signInMember(normalized);
    if (existingUser) {
      console.log('Account already exists:', existingUser.id);
      return existingUser;
    }

    // Create new account if sign in failed
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: normalized,
      options: {
        data: {
          member_number: normalized,
        }
      }
    });

    if (signUpError) {
      console.error('Error creating auth account:', signUpError);
      throw signUpError;
    }

    if (!signUpData?.user) {
      throw new Error('Failed to create auth account - no user returned');
    }

    console.log('Auth account created:', signUpData.user.id);
    return signUpData.user;
  } catch (error) {
    console.error('Error during auth account creation:', error);
    throw error;
  }
}

export async function linkMemberToAuth(memberId: string, authUserId: string) {
  console.log('Linking member to auth:', memberId, authUserId);
  
  const { error } = await supabase
    .from('members')
    .update({ auth_user_id: authUserId })
    .eq('id', memberId);

  if (error) {
    console.error('Error linking member to auth:', error);
    throw new Error('Failed to link member account');
  }

  console.log('Successfully linked member to auth');
}