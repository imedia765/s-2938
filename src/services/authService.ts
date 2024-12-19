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
  
  try {
    // First, get the collector information
    const { data: collector, error: collectorError } = await supabase
      .from('collectors')
      .select('prefix, number')
      .eq('id', collectorId)
      .single();

    if (collectorError) {
      console.error("Error fetching collector:", collectorError);
      throw collectorError;
    }

    if (!collector) {
      throw new Error("Collector not found");
    }

    // Get the latest member number for this collector
    const { data: latestMember, error: memberError } = await supabase
      .from('members')
      .select('member_number')
      .like('member_number', `${collector.prefix}${collector.number}%`)
      .order('member_number', { ascending: false })
      .limit(1)
      .single();

    if (memberError && memberError.code !== 'PGRST116') {
      console.error("Error fetching latest member:", memberError);
      throw memberError;
    }

    // Calculate the next sequence number
    let sequence = 1;
    if (latestMember) {
      const currentSequence = parseInt(latestMember.member_number.substring((collector.prefix + collector.number).length)) || 0;
      sequence = currentSequence + 1;
    }

    const memberNumber = `${collector.prefix}${collector.number}${String(sequence).padStart(3, '0')}`;
    console.log("Generated member number:", memberNumber);

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
      member_number: memberNumber,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newMember, error: insertError } = await supabase
      .from('members')
      .insert(memberObject)
      .select()
      .single();

    if (insertError) {
      console.error("Member creation error:", insertError);
      throw insertError;
    }

    console.log("Member created successfully:", newMember);
    return newMember;
  } catch (error) {
    console.error("Error in createMember:", error);
    throw error;
  }
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