import { supabase } from "@/integrations/supabase/client";

export async function getMemberByMemberId(memberId: string) {
  console.log("Searching for member with member_number:", memberId);
  
  // First, let's check if we can access the database at all
  const { data: tableInfo, error: tableError } = await supabase
    .from('members')
    .select('count');
  
  console.log("Database connection check:", { tableInfo, tableError });
  
  // Get all members to verify data is accessible
  const { data: allMembers, error: membersError } = await supabase
    .from('members')
    .select('member_number, full_name, email')
    .limit(10);
    
  console.log("Sample of members in database:", allMembers);
  console.log("Members query error if any:", membersError);
  
  // Now try to find the specific member with exact match
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('member_number', memberId.toUpperCase().trim());

  if (error) {
    console.error("Database error when looking up member:", error);
    throw error;
  }

  console.log("Member lookup result:", { data });
  
  if (!data || data.length === 0) {
    console.log("No member found with member_number:", memberId);
    return null;
  }
  
  // Return the first matching member
  return data[0];
}

export async function verifyMemberPassword(password: string, storedHash: string | null) {
  if (!storedHash) {
    console.error("No stored hash provided for password verification");
    return false;
  }

  console.log("Verifying password hash...");
  const encoder = new TextEncoder();
  const passwordBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(password));
  const hashedPassword = Array.from(new Uint8Array(passwordBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  console.log("Password verification:", {
    providedPasswordLength: password.length,
    generatedHashLength: hashedPassword.length,
    storedHashLength: storedHash.length,
    matches: hashedPassword === storedHash
  });
  
  return hashedPassword === storedHash;
}