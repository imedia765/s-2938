import { supabase } from "@/integrations/supabase/client";
import { saveAs } from 'file-saver';

const TABLES = [
  'ticket_responses',
  'support_tickets',
  'registrations',
  'payments',
  'family_members',
  'admin_notes',
  'members',
  'collectors',
  'profiles'
] as const;

type TableName = typeof TABLES[number];

async function logDatabaseAction(action: string, details?: string) {
  try {
    const { error } = await supabase
      .from('database_logs')
      .insert({
        action,
        details,
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error logging database action:', error);
  }
}

export async function exportDatabase() {
  try {
    const results = await Promise.all(
      TABLES.map(table => 
        supabase.from(table).select('*')
      )
    );

    const backupData = {
      members: results[0].data,
      collectors: results[1].data,
      payments: results[2].data,
      familyMembers: results[3].data,
      registrations: results[4].data,
      supportTickets: results[5].data,
      ticketResponses: results[6].data,
      adminNotes: results[7].data,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json'
    });
    
    const fileName = `database_backup_${new Date().toISOString()}.json`;
    saveAs(blob, fileName);
    
    await logDatabaseAction('backup', `Database backup created: ${fileName}`);
    return { success: true };
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
}

export async function restoreDatabase(backupFile: File) {
  try {
    const fileContent = await backupFile.text();
    const backupData = JSON.parse(fileContent);

    if (!backupData.timestamp || !backupData.members) {
      throw new Error('Invalid backup file format');
    }

    const tableMap: Record<string, TableName> = {
      members: 'members',
      collectors: 'collectors',
      payments: 'payments',
      familyMembers: 'family_members',
      registrations: 'registrations',
      supportTickets: 'support_tickets',
      ticketResponses: 'ticket_responses',
      adminNotes: 'admin_notes'
    };

    // Process collectors first to ensure they exist for member references
    if (backupData.collectors && Array.isArray(backupData.collectors)) {
      const { error: deleteCollectorsError } = await supabase
        .from('collectors')
        .delete()
        .filter('id', 'not.is', null);

      if (deleteCollectorsError) throw deleteCollectorsError;

      // Process collectors in batches
      const batchSize = 50;
      for (let i = 0; i < backupData.collectors.length; i += batchSize) {
        const batch = backupData.collectors
          .slice(i, Math.min(i + batchSize, backupData.collectors.length))
          .map(({ id, ...rest }) => ({
            ...rest,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));

        const { error } = await supabase
          .from('collectors')
          .insert(batch);

        if (error) throw error;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Process other tables
    for (const [key, table] of Object.entries(tableMap)) {
      if (key === 'collectors') continue; // Skip collectors as we've already processed them
      
      const data = backupData[key];
      if (!Array.isArray(data)) continue;

      console.log(`Processing ${table}...`);

      // Delete existing records
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .filter('id', 'not.is', null);

      if (deleteError) {
        console.error(`Error clearing ${table}:`, deleteError);
        throw deleteError;
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      if (data.length > 0) {
        const batchSize = 50;
        for (let i = 0; i < data.length; i += batchSize) {
          const batch = data.slice(i, Math.min(i + batchSize, data.length));
          
          // Special handling for members to avoid member_number conflicts
          const processedBatch = batch.map(({ id, member_number, ...rest }) => ({
            ...rest,
            // For members table, don't include member_number to let trigger generate new ones
            ...(table !== 'members' && { member_number }),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));

          const { error: insertError } = await supabase
            .from(table)
            .insert(processedBatch);

          if (insertError) {
            console.error(`Error restoring ${table}:`, insertError);
            throw insertError;
          }

          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }

    await logDatabaseAction('restore', `Database restored from backup created at ${backupData.timestamp}`);
    return { success: true };
  } catch (error) {
    console.error('Error restoring backup:', error);
    throw error;
  }
}

export async function getDatabaseStatus() {
  try {
    const { data: logs, error } = await supabase
      .from('database_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    const lastAction = logs && logs.length > 0 ? {
      action: logs[0].action,
      timestamp: new Date(logs[0].created_at).toLocaleString(),
      details: logs[0].details
    } : null;

    const tableSizes = await Promise.all(
      TABLES.map(async (table) => {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        return count || 0;
      })
    );

    const totalRows = tableSizes.reduce((acc, curr) => acc + curr, 0);
    const estimatedSize = Math.round(totalRows * 0.5);

    return {
      lastAction,
      totalRows,
      estimatedSize: `${estimatedSize} KB`
    };
  } catch (error) {
    console.error('Error getting database status:', error);
    throw error;
  }
}