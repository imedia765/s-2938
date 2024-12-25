import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";

// Utility to remove empty fields from an object
export function removeEmptyFields<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      if (value === null || value === undefined || value === '') {
        return false;
      }
      return true;
    })
  ) as Partial<T>;
}

// Function to clean and format text fields
function cleanTextValue(value: string | null | undefined): string | null {
  if (!value) return null;
  value = value.trim();
  if (value.toLowerCase() === 'unknown' || 
      value.toLowerCase() === 'n/a' || 
      value.toLowerCase() === 'postcode unknown' || 
      value.toLowerCase() === 'town unknown') {
    return null;
  }
  return value;
}

// Function to normalize phone numbers
function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 0) return null;
  return cleaned;
}

// Function to validate email
function validateEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  email = email.trim().toLowerCase();
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) ? email : null;
}

// Transform member data to match Supabase schema
export function transformMemberForSupabase(memberData: any): TablesInsert<'members'> {
  console.log('Raw member data:', memberData);
  
  // Extract name from various possible fields
  const fullName = cleanTextValue(
    memberData.full_name || 
    memberData.name || 
    memberData.Name || 
    memberData["Full Name"] || 
    memberData["FullName"]
  );

  if (!fullName) {
    console.error('Missing name in member data:', memberData);
    throw new Error('Member name is required');
  }

  const cleanedData = removeEmptyFields({
    id: memberData.id,
    member_number: memberData.member_number,
    collector_id: memberData.collector_id,
    full_name: fullName,
    address: cleanTextValue(memberData.address),
    email: validateEmail(memberData.email),
    gender: cleanTextValue(memberData.gender),
    marital_status: cleanTextValue(memberData.marital_status),
    phone: normalizePhone(memberData.phone),
    date_of_birth: memberData.date_of_birth,
    postcode: cleanTextValue(memberData.postcode),
    town: cleanTextValue(memberData.town),
    verified: memberData.verified || false,
    status: 'active',
    membership_type: memberData.membership_type || 'standard'
  });

  console.log('Transformed member data:', cleanedData);
  return cleanedData as TablesInsert<'members'>;
}