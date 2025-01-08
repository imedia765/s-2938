import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle2, XCircle, Activity, Cpu, Memory, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';

interface TestResult {
  file: string;
  passed: boolean;
  details: string;
  duration?: number;
  memory?: number;
}

interface TestResults {
  totalTests: number;
  passed: number;
  failed: number;
  results: TestResult[];
  performance?: {
    totalDuration: number;
    maxMemoryUsage: number;
    cpuUsage: number;
  };
}

export const TestRunner: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResults | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const runTests = async () => {
    setIsRunning(true);
    setResults(null);
    setProgress(0);
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const { data, error } = await supabase.functions.invoke('run-tests');

      clearInterval(progressInterval);
      setProgress(100);

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

      {isRunning && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-dashboard-muted text-center">{progress}% Complete</p>
        </div>
      )}

      {results && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-dashboard-dark rounded-lg">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-dashboard-text">Total Tests</p>
                  <p className="text-2xl font-semibold text-dashboard-accent1">{results.totalTests}</p>
                </div>
                <Activity className="h-8 w-8 text-dashboard-accent1" />
              </div>
            </div>
            <div className="p-4 bg-dashboard-dark rounded-lg">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-dashboard-text">Passed</p>
                  <p className="text-2xl font-semibold text-emerald-500">{results.passed}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
            </div>
            <div className="p-4 bg-dashboard-dark rounded-lg">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-dashboard-text">Failed</p>
                  <p className="text-2xl font-semibold text-red-500">{results.failed}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </div>
          </div>

          {results.performance && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-dashboard-dark rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-dashboard-text">Duration</p>
                    <p className="text-xl font-semibold text-dashboard-accent1">
                      {results.performance.totalDuration.toFixed(2)}s
                    </p>
                  </div>
                  <Clock className="h-6 w-6 text-dashboard-accent1" />
                </div>
              </div>
              <div className="p-4 bg-dashboard-dark rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-dashboard-text">Memory Usage</p>
                    <p className="text-xl font-semibold text-dashboard-accent1">
                      {(results.performance.maxMemoryUsage / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Memory className="h-6 w-6 text-dashboard-accent1" />
                </div>
              </div>
              <div className="p-4 bg-dashboard-dark rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-dashboard-text">CPU Usage</p>
                    <p className="text-xl font-semibold text-dashboard-accent1">
                      {results.performance.cpuUsage.toFixed(1)}%
                    </p>
                  </div>
                  <Cpu className="h-6 w-6 text-dashboard-accent1" />
                </div>
              </div>
            </div>
          )}

          <ScrollArea className="h-[300px] rounded-md border border-dashboard-cardBorder">
            <div className="p-4 space-y-2">
              {results.results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg flex items-start justify-between ${
                    result.passed ? 'bg-green-500/10' : 'bg-red-500/10'
                  }`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-dashboard-text">
                        {result.file}
                      </p>
                      {result.duration && (
                        <span className="text-xs text-dashboard-muted">
                          {result.duration.toFixed(2)}ms
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-dashboard-muted">
                      {result.details}
                    </p>
                    {result.memory && (
                      <p className="text-xs text-dashboard-muted">
                        Memory: {(result.memory / 1024 / 1024).toFixed(2)} MB
                      </p>
                    )}
                  </div>
                  {result.passed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 ml-4 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 ml-4 flex-shrink-0" />
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