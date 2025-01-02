import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          throw new Error("No user found");
        }

        // First try to get the member by auth_user_id
        let { data: profileData, error: profileError } = await supabase
          .from("members")
          .select(`
            id,
            member_number,
            full_name,
            email,
            phone,
            address,
            town,
            postcode,
            status,
            role,
            membership_type,
            date_of_birth,
            collector_id,
            created_at,
            updated_at
          `)
          .eq('auth_user_id', session.user.id)
          .maybeSingle();

        // If not found by auth_user_id, try by member_number (from user metadata)
        if (!profileData && session.user.user_metadata?.member_number) {
          const { data: memberData, error: memberError } = await supabase
            .from("members")
            .select(`
              id,
              member_number,
              full_name,
              email,
              phone,
              address,
              town,
              postcode,
              status,
              role,
              membership_type,
              date_of_birth,
              collector_id,
              created_at,
              updated_at
            `)
            .eq('member_number', session.user.user_metadata.member_number)
            .maybeSingle();

          if (memberError) {
            console.error("Member fetch error:", memberError);
            throw memberError;
          }

          if (memberData) {
            // If found by member_number, update the auth_user_id
            const { error: updateError } = await supabase
              .from("members")
              .update({ auth_user_id: session.user.id })
              .eq('id', memberData.id);

            if (updateError) {
              console.error("Failed to update auth_user_id:", updateError);
            }

            profileData = memberData;
          }
        }

        if (!profileData) {
          console.error("No profile found for user");
          throw new Error("Profile not found");
        }

        return profileData;
      } catch (err) {
        console.error("Error in profile query:", err);
        throw err;
      }
    },
    retry: 1,
    staleTime: 30000, // Cache for 30 seconds
  });

  if (error) {
    console.error("Dashboard error:", error);
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="max-w-3xl mx-auto">
            <Card className="p-6">
              <p className="text-center text-red-500">
                {error instanceof Error ? error.message : "Error loading profile data. Please try again later."}
              </p>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#4a9eed] to-[#63b3ff] text-transparent bg-clip-text">
              My Profile
            </h1>
          </div>

          <Card className="p-6">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : profile ? (
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback>
                      {profile.full_name?.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-semibold">{profile.full_name}</h2>
                    <Badge variant={profile.status === 'active' ? 'success' : 'secondary'}>
                      {profile.status || 'Inactive'}
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Member Number</p>
                    <p className="font-medium">{profile.member_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <p className="font-medium capitalize">{profile.role}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{profile.email || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{profile.phone || '—'}</p>
                  </div>
                  {profile.address && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">
                        {profile.address}
                        {profile.town && `, ${profile.town}`}
                        {profile.postcode && ` ${profile.postcode}`}
                      </p>
                    </div>
                  )}
                  {profile.membership_type && (
                    <div>
                      <p className="text-sm text-muted-foreground">Membership Type</p>
                      <p className="font-medium capitalize">{profile.membership_type}</p>
                    </div>
                  )}
                  {profile.date_of_birth && (
                    <div>
                      <p className="text-sm text-muted-foreground">Date of Birth</p>
                      <p className="font-medium">
                        {new Date(profile.date_of_birth).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground">No profile data found</p>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;