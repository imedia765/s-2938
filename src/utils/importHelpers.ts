import { supabase } from "@/integrations/supabase/client";
import { transformMemberForSupabase } from "@/utils/dataCleanup";

interface CsvData {
  collector: string;
  [key: string]: any;
}

export async function processCollectors(validData: CsvData[], userId: string) {
  const uniqueCollectors = [...new Set(validData.map(item => item.collector).filter(Boolean))];
  console.log('Processing collectors:', uniqueCollectors);
  
  const collectorIdMap = new Map<string, string>();

  for (const collectorName of uniqueCollectors) {
    try {
      if (!collectorName || collectorName.length < 2) {
        console.error('Invalid collector name:', collectorName);
        continue;
      }

      console.log('Processing collector:', collectorName);
      
      // First try to find existing collector
      const { data: existingCollectors, error: selectError } = await supabase
        .from('collectors')
        .select('id, name, prefix, number')
        .ilike('name', collectorName);

      if (selectError) {
        console.error('Error finding collector:', selectError);
        continue;
      }

      if (existingCollectors && existingCollectors.length > 0) {
        collectorIdMap.set(collectorName, existingCollectors[0].id);
        console.log('Using existing collector:', { id: existingCollectors[0].id, name: collectorName });
        continue;
      }

      // Generate prefix from collector name
      const prefix = collectorName
        .split(/[\s/&]+/)
        .map(word => word.charAt(0).toUpperCase())
        .join('');

      // Get the next available number for this prefix
      const { data: lastCollector } = await supabase
        .from('collectors')
        .select('number')
        .eq('prefix', prefix)
        .order('number', { ascending: false })
        .limit(1);

      const nextNumber = lastCollector && lastCollector.length > 0
        ? String(parseInt(lastCollector[0].number) + 1).padStart(3, '0')
        : '001';

      // If no existing collector, create new one
      const { data: newCollector, error: insertError } = await supabase
        .from('collectors')
        .insert({
          name: collectorName,
          prefix: prefix,
          number: nextNumber,
          active: true
        })
        .select('id')
        .maybeSingle();

      if (insertError) {
        console.error('Error inserting collector:', insertError);
        continue;
      }

      if (newCollector) {
        collectorIdMap.set(collectorName, newCollector.id);
        console.log('Created new collector:', { id: newCollector.id, name: collectorName });
      }
    } catch (error) {
      console.error(`Error processing collector ${collectorName}:`, error);
    }
  }

  return collectorIdMap;
}

export async function processMembers(validData: CsvData[], collectorIdMap: Map<string, string>, userId: string) {
  let processedCount = 0;
  const batchSize = 50; // Process members in smaller batches
  
  for (let i = 0; i < validData.length; i += batchSize) {
    const batch = validData.slice(i, i + batchSize);
    console.log(`Processing batch ${i / batchSize + 1} of ${Math.ceil(validData.length / batchSize)}`);
    
    for (const member of batch) {
      try {
        if (!member.collector) {
          console.warn('Member has no collector:', member);
          continue;
        }

        const collectorId = collectorIdMap.get(member.collector);
        if (!collectorId) {
          console.error(`No collector ID found for ${member.collector}`);
          continue;
        }

        // Check for existing member
        const { data: existingMembers, error: selectError } = await supabase
          .from('members')
          .select('id')
          .eq('member_number', member.member_number);

        if (selectError) {
          console.error('Error checking existing member:', selectError);
          continue;
        }

        const memberData = transformMemberForSupabase({
          ...member,
          collector_id: collectorId
        });

        if (existingMembers && existingMembers.length > 0) {
          // Update existing member
          const { error: updateError } = await supabase
            .from('members')
            .update(memberData)
            .eq('id', existingMembers[0].id);

          if (updateError) {
            console.error('Error updating member:', updateError);
            continue;
          }
        } else {
          // Insert new member
          const { error: insertError } = await supabase
            .from('members')
            .insert(memberData);

          if (insertError) {
            console.error('Error inserting member:', insertError);
            continue;
          }
        }
        
        processedCount++;
        if (processedCount % 10 === 0) {
          console.log(`Processed ${processedCount} members so far...`);
        }
      } catch (error) {
        console.error('Error processing member:', error);
      }
    }
    
    // Add a small delay between batches to prevent rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('Total members processed:', processedCount);
  return processedCount;
}