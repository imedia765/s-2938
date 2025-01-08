import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogsTabsType } from '../../constants/logs';

interface LogsTabsProps {
  activeTab: LogsTabsType;
  onTabChange: (tab: LogsTabsType) => void;
}

export const LogsTabs: React.FC<LogsTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
        <TabsTrigger 
          value="AUDIT"
          className="data-[state=active]:bg-dashboard-accent1 data-[state=active]:text-white"
        >
          Audit Logs
        </TabsTrigger>
        <TabsTrigger 
          value="MONITORING"
          className="data-[state=active]:bg-dashboard-accent1 data-[state=active]:text-white"
        >
          Monitoring Logs
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};