import { supabase } from "@/integrations/supabase/client";
import type { User } from '@supabase/supabase-js';

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

export async function signInMember(memberNumber: string): Promise<User | null> {
  console.log('Attempting to sign in member:', memberNumber);
  const normalized = normalizeMemberNumber(memberNumber);
  const email = `${normalized}@temp.pwaburton.org`;

  try {
    // First, check if user exists in auth system
    const { data: { users }, error: getUserError } = await supabase.auth.admin.listUsers();
    
    if (getUserError) {
      console.error('Error listing users:', getUserError);
      throw getUserError;
    }

    const existingUser = users?.find((u: User) => u.email === email);

    if (!existingUser) {
      console.log('User does not exist, creating new account');
      // Create new user
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
        console.error('Sign up error:', signUpError);
        throw signUpError;
      }

      // Update member record with auth_user_id
      if (signUpData.user) {
        await supabase
          .from('members')
          .update({ auth_user_id: signUpData.user.id })
          .eq('member_number', normalized);
      }

      return signUpData.user;
    }

    // User exists, attempt sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: normalized,
    });

    if (signInError) {
      console.error('Sign in error:', signInError);
      throw signInError;
    }

    console.log('Sign in successful:', signInData.user?.id);
    return signInData.user;
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}