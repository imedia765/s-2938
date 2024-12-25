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

async function getNextCollectorNumber(): Promise<string> {
  const { data: collectors } = await supabase
    .from('collectors')
    .select('number')
    .order('number', { ascending: false })
    .limit(1);

  const nextNumber = collectors && collectors.length > 0
    ? String(Number(collectors[0].number) + 1).padStart(2, '0')
    : '01';
    
  return nextNumber;
}

// Function to validate and parse date
function parseDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  
  // If it's clearly not a date, return null
  if (dateStr === 'Town Unknown' || dateStr === 'Unknown' || dateStr === 'N/A') {
    return null;
  }

  try {
    const date = new Date(dateStr);
    // Check if it's a valid date
    if (isNaN(date.getTime())) {
      console.log('Invalid date format:', dateStr);
      return null;
    }
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.log('Error parsing date:', dateStr, error);
    return null;
  }
}

// Function to clean and format text fields
function cleanTextValue(value: string | null | undefined): string | null {
  if (!value) return null;
  value = value.trim();
  if (value.toLowerCase() === 'unknown' || value.toLowerCase() === 'n/a') return null;
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
    memberData["Name"] || 
    memberData["Full Name"] || 
    memberData["FullName"] || 
    memberData["full_name"] ||
    memberData["name"]
  );

  if (!fullName) {
    console.error('Missing name in member data:', memberData);
    throw new Error('Member name is required');
  }

  const cleanedData = removeEmptyFields({
    full_name: fullName,
    member_number: '', // Will be generated by trigger
    address: cleanTextValue(memberData["Address"] || memberData["address"]),
    email: validateEmail(memberData["Email"] || memberData["email"]),
    gender: cleanTextValue(memberData["Gender"] || memberData["gender"]),
    marital_status: cleanTextValue(memberData["Marital Status"] || memberData["marital_status"]),
    phone: normalizePhone(memberData["Phone"] || memberData["Mobile"] || memberData["phone"]),
    date_of_birth: parseDate(memberData["Date of Birth"] || memberData["date_of_birth"]),
    postcode: cleanTextValue(memberData["Postcode"] || memberData["postcode"]),
    town: cleanTextValue(memberData["Town"] || memberData["town"]),
    verified: memberData["Verified"] || memberData["verified"] || false,
    status: 'active',
  });

  console.log('Transformed member data:', cleanedData);
  return cleanedData as TablesInsert<'members'>;
}

// Transform collector data to match Supabase schema
export async function transformCollectorForSupabase(collectorName: string): Promise<TablesInsert<'collectors'> | null> {
  if (!collectorName) {
    throw new Error('Collector name is required');
  }

  collectorName = cleanTextValue(collectorName) || '';

  // First check if collector already exists
  const { data: existingCollectors } = await supabase
    .from('collectors')
    .select('*')
    .ilike('name', collectorName);

  if (existingCollectors && existingCollectors.length > 0) {
    console.log('Collector already exists:', existingCollectors[0]);
    return null; // Return null to indicate we should use existing collector
  }

  const nameParts = collectorName.split(/[\s&-]/);
  const prefix = nameParts
    .map(part => part.substring(0, 2).toUpperCase())
    .join('');
  
  const number = await getNextCollectorNumber();

  const collectorData: TablesInsert<'collectors'> = {
    name: collectorName,
    prefix,
    number,
    active: true,
  };

  return collectorData;
}