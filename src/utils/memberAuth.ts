import { supabase } from "@/integrations/supabase/client";

export async function getMemberByMemberId(memberId: string) {
  const cleanMemberId = memberId.toUpperCase().trim();
  console.log("Looking up member with member_number:", cleanMemberId);
  
  try {
    // First attempt - exact match
    const { data: members, error } = await supabase
      .from('members')
      .select('*')
      .eq('member_number', cleanMemberId)
      .limit(1);

    if (error) {
      console.error("Database error when looking up member:", error);
      throw error;
    }

    // Log the raw query response
    console.log("Raw query response:", { members, error });

    if (!members || members.length === 0) {
      console.log("No exact match found, trying case-insensitive search");
      
      // Second attempt - case insensitive match
      const { data: caseInsensitiveMembers, error: ciError } = await supabase
        .from('members')
        .select('*')
        .ilike('member_number', cleanMemberId)
        .limit(1);

      if (ciError) {
        console.error("Database error in case-insensitive search:", ciError);
        throw ciError;
      }

      // Log case-insensitive results
      console.log("Case-insensitive search results:", caseInsensitiveMembers);
      
      const member = caseInsensitiveMembers?.[0] || null;
      console.log("Final member lookup result:", member);
      return member;
    }

    const member = members[0];
    console.log("Final member lookup result:", member);
    return member;
  } catch (error) {
    console.error("Error in getMemberByMemberId:", error);
    return null;
  }
}

export async function verifyMemberPassword(memberId: string, password: string) {
  const member = await getMemberByMemberId(memberId);
  
  if (!member) {
    console.log("No member found for verification");
    return false;
  }

  // For development, just check if password matches member number
  // In production, this should use proper password hashing
  return password === member.member_number;
}