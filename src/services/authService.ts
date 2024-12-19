import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";

export const signUpUser = async (email: string, password: string) => {
  console.log("Attempting to sign up user with email:", email);
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/admin`,
      },
    });

    if (error) {
      console.error("Sign up error:", error);
      
      if (error.status === 429) {
        throw new Error("You've reached the maximum number of registration attempts. Please wait a few minutes before trying again.");
      }

      if (error.message?.includes('already registered')) {
        throw new Error("This email is already registered. Please try logging in instead.");
      }

      throw error;
    }

    console.log("Sign up successful:", data);
    return data;
  } catch (error: any) {
    console.error("Sign up error:", error);
    throw error;
  }
};

export const createMember = async (memberData: any, collectorId: string) => {
  console.log("Creating member with data:", { memberData, collectorId });
  
  const retryAttempts = 3;
  let lastError;

  for (let attempt = 1; attempt <= retryAttempts; attempt++) {
    try {
      const memberObject: TablesInsert<'members'> = {
        collector_id: collectorId,
        full_name: memberData.fullName,
        email: memberData.email,
        phone: memberData.mobile,
        address: memberData.address,
        town: memberData.town,
        postcode: memberData.postCode,
        date_of_birth: memberData.dob,
        gender: memberData.gender,
        marital_status: memberData.maritalStatus,
        status: 'pending',
        profile_updated: true,
        member_number: '', // This will be auto-generated by the database trigger
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('members')
        .insert(memberObject)
        .select()
        .single();

      if (error) {
        console.error(`Member creation error (attempt ${attempt}):`, error);
        
        if (error.code === '23505' && attempt < retryAttempts) {
          // If it's a duplicate error and we haven't exceeded retry attempts,
          // wait a short time and try again
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          lastError = error;
          continue;
        }
        
        throw error;
      }

      console.log("Member created successfully:", data);
      return data;
    } catch (error) {
      console.error(`Error creating member (attempt ${attempt}):`, error);
      lastError = error;
      
      if (attempt === retryAttempts) {
        throw new Error("Failed to create member after multiple attempts. Please try again.");
      }
    }
  }

  throw lastError;
};

export const createRegistration = async (memberId: string) => {
  console.log("Creating registration for member:", memberId);
  
  try {
    const { data, error } = await supabase
      .from('registrations')
      .insert({
        member_id: memberId,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error("Registration creation error:", error);
      throw error;
    }

    console.log("Registration created successfully:", data);
    return data;
  } catch (error) {
    console.error("Error creating registration:", error);
    throw error;
  }
};