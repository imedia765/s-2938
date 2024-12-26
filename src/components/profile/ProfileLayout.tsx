import { Skeleton } from "@/components/ui/skeleton";
import { AccountSettingsSection } from "./AccountSettingsSection";
import { DocumentsSection } from "./DocumentsSection";
import { PaymentHistorySection } from "./PaymentHistorySection";
import { SupportSection } from "./SupportSection";

interface ProfileLayoutProps {
  memberData: any;
  documents: any[];
  documentTypes: any[];
  searchDate: string;
  searchAmount: string;
  onSearchDateChange: (value: string) => void;
  onSearchAmountChange: (value: string) => void;
}

export const ProfileLayout = ({
  memberData,
  documents,
  documentTypes,
  searchDate,
  searchAmount,
  onSearchDateChange,
  onSearchAmountChange,
}: ProfileLayoutProps) => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto p-6">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
        Member Profile
      </h1>

      <div className="space-y-6">
        <AccountSettingsSection memberData={memberData} />
        <DocumentsSection 
          documents={documents}
          documentTypes={documentTypes}
        />
        <PaymentHistorySection 
          memberId={memberData?.id || ''}
          searchDate={searchDate}
          searchAmount={searchAmount}
          onSearchDateChange={onSearchDateChange}
          onSearchAmountChange={onSearchAmountChange}
        />
        <SupportSection />
      </div>
    </div>
  );
};

export const ProfileSkeleton = () => (
  <div className="space-y-6 max-w-5xl mx-auto p-6">
    <Skeleton className="h-8 w-64" />
    <div className="space-y-6">
      <Skeleton className="h-96" />
      <Skeleton className="h-64" />
      <Skeleton className="h-64" />
      <Skeleton className="h-64" />
    </div>
  </div>
);