import { supabase } from "@/integrations/supabase/client";

export const getMemberByMemberId = async (memberId: string) => {
  console.log("Looking up member with member_number:", memberId);
  
  try {
    const { data: members, error } = await supabase
      .from('members')
      .select('*')
      .eq('member_number', memberId.toUpperCase())
      .limit(1);

    console.log("Raw query response:", { members, error });

    if (error) {
      console.error("Error fetching member:", error);
      return null;
    }

    const member = members?.[0] || null;
    console.log("Final member lookup result:", member);
    return member;
  } catch (error) {
    console.error("Error in getMemberByMemberId:", error);
    return null;
  }
};