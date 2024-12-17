import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function CodebaseBackupSection() {
  const { toast } = useToast();

  const handleDownload = async () => {
    try {
      const response = await fetch('/api/backup-codebase');
      if (!response.ok) {
        throw new Error('Failed to generate backup');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `codebase-backup-${timestamp}.zip`;
      
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Log the backup in the database
      const { error } = await supabase
        .from('codebase_backups')
        .insert({
          filename,
          size: blob.size,
        });

      if (error) {
        console.error('Error logging backup:', error);
      }

      toast({
        title: "Backup downloaded successfully",
        description: `Saved as ${filename}`,
      });
    } catch (error) {
      console.error('Backup error:', error);
      toast({
        title: "Backup failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Codebase Backup</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Download a complete backup of the application codebase. This includes all source files, configurations, and assets.
        </p>
        <Button 
          className="w-full flex items-center gap-2"
          onClick={handleDownload}
        >
          <Download className="h-4 w-4" />
          Download Codebase
        </Button>
      </CardContent>
    </Card>
  );
}