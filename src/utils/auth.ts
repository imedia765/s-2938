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
    // First try to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: normalized,
    });

    if (!signInError && signInData?.user) {
      console.log('Sign in successful:', signInData.user.id);
      return signInData.user;
    }

    // If sign in fails with invalid credentials, try to create account
    if (signInError?.message.includes('Invalid login credentials')) {
      console.log('Invalid credentials, attempting to create account');
      return await createAuthAccount(normalized);
    }

    console.error('Sign in error:', signInError);
    throw signInError;
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}

export async function createAuthAccount(memberNumber: string) {
  console.log('Creating auth account for member:', memberNumber);
  const normalized = normalizeMemberNumber(memberNumber);
  const email = `${normalized}@temp.pwaburton.org`;

  try {
    // Check if user exists first
    const { data: existingUser } = await supabase.auth.signInWithPassword({
      email,
      password: normalized,
    });

    if (existingUser?.user) {
      console.log('Account already exists:', existingUser.user.id);
      return existingUser.user;
    }

    // Create new account if user doesn't exist
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
      // If user already exists but we couldn't sign in, there might be a password mismatch
      if (signUpError.message.includes('already registered')) {
        console.log('User exists but password mismatch, attempting password reset');
        // In a real app, you might want to implement password reset here
        throw new Error('Account exists but password is incorrect. Please contact support.');
      }
      
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