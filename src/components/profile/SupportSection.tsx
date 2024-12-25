import { HeadsetIcon, MailIcon, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TicketingSection } from "./TicketingSection";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const SupportSection = () => {
  const { data: collectorInfo } = useQuery({
    queryKey: ['collector-info'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const memberNumber = session.user.user_metadata?.member_number;
      
      if (!memberNumber) {
        console.log('No member number found in session');
        return null;
      }

      const { data: member, error: memberError } = await supabase
        .from('members')
        .select(`
          collector:collectors (
            name,
            email,
            phone
          )
        `)
        .eq('member_number', memberNumber)
        .single();

      if (memberError) {
        console.error('Error fetching collector info:', memberError);
        return null;
      }

      return member?.collector;
    }
  });

  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button 
          variant="default"
          className="flex items-center gap-2 w-full justify-between bg-primary hover:bg-primary/90"
        >
          <div className="flex items-center gap-2">
            <HeadsetIcon className="h-4 w-4" />
            <span>Support</span>
          </div>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-4">
        <div className="space-y-6">
          <div className="space-y-4 p-4">
            <p className="text-sm text-muted-foreground">
              Need help? Contact your collector through any of these channels:
            </p>
            <div className="space-y-2">
              {collectorInfo ? (
                <>
                  <div className="flex items-center gap-2">
                    <HeadsetIcon className="h-4 w-4" />
                    <span>Collector: {collectorInfo.name}</span>
                  </div>
                  {collectorInfo.email && (
                    <div className="flex items-center gap-2">
                      <MailIcon className="h-4 w-4" />
                      <span>{collectorInfo.email}</span>
                    </div>
                  )}
                  {collectorInfo.phone && (
                    <div className="flex items-center gap-2">
                      <PhoneCall className="h-4 w-4" />
                      <span>{collectorInfo.phone}</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Loading collector information...</p>
              )}
            </div>
          </div>
          
          <TicketingSection />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};