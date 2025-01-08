import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TestResult {
  file: string;
  passed: boolean;
  details: string;
}

interface TestResults {
  totalTests: number;
  passed: number;
  failed: number;
  results: TestResult[];
}

export const TestRunner: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResults | null>(null);
  const { toast } = useToast();

  const runTests = async () => {
    setIsRunning(true);
    setResults(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('run-tests');

      if (error) {
        throw error;
      }

      setResults(data as TestResults);
      
      toast({
        title: "Tests Completed",
        description: `${data.passed} of ${data.totalTests} tests passed`,
        variant: data.failed === 0 ? "default" : "destructive",
      });
    } catch (error) {
      console.error('Error running tests:', error);
      toast({
        title: "Error Running Tests",
        description: error.message || "An error occurred while running tests",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-dashboard-card rounded-lg shadow-lg p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-dashboard-accent1">Test Runner</h2>
        <Button 
          onClick={runTests} 
          disabled={isRunning}
          className="bg-dashboard-accent1 hover:bg-dashboard-highlight text-white"
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Tests...
            </>
          ) : (
            'Run Tests'
          )}
        </Button>
      </div>

      {results && (
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between p-4 bg-dashboard-dark rounded-lg">
            <div className="space-y-1">
              <p className="text-sm text-dashboard-text">Total Tests: {results.totalTests}</p>
              <p className="text-sm text-green-500">Passed: {results.passed}</p>
              <p className="text-sm text-red-500">Failed: {results.failed}</p>
            </div>
          </div>

          <ScrollArea className="h-[300px] rounded-md border border-dashboard-cardBorder">
            <div className="p-4 space-y-2">
              {results.results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg flex items-start justify-between ${
                    result.passed ? 'bg-green-500/10' : 'bg-red-500/10'
                  }`}
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-dashboard-text">
                      {result.file}
                    </p>
                    <p className="text-xs text-dashboard-muted">
                      {result.details}
                    </p>
                  </div>
                  {result.passed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};