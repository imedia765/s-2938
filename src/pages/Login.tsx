import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginTabs } from "@/components/auth/LoginTabs";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { getMemberByMemberId } from "@/utils/memberAuth";
import { supabase } from "@/integrations/supabase/client";
import { createHash } from 'crypto-js/sha256';

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error) {
      console.error("Email login error:", error);
      toast({
        title: "Login failed",
        description: "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMemberIdSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Member ID login attempt started");
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const memberId = (formData.get('memberId') as string).toUpperCase().trim();
    const password = formData.get('memberPassword') as string;
    
    try {
      // First, get the member details
      const member = await getMemberByMemberId(memberId);
      console.log("Member lookup complete:", member);

      if (!member) {
        throw new Error("Member ID not found. Please check your Member ID and try again.");
      }

      if (!member.email) {
        throw new Error("No email associated with this Member ID. Please contact support.");
      }

      // Verify the password matches the default password hash
      const hashedPassword = createHash(password).toString();
      if (hashedPassword !== member.default_password_hash) {
        throw new Error("Invalid password. Please try again.");
      }

      // If password is correct, attempt to sign in with Supabase
      console.log("Attempting Supabase auth with email:", member.email);
      const { error } = await supabase.auth.signInWithPassword({
        email: member.email,
        password: password, // Use the member ID as the password
      });

      if (error) {
        console.error("Supabase auth error:", error);
        throw error;
      }

      console.log("Login successful");
    } catch (error) {
      console.error("Member ID login error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid member ID or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-lg mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">Login</CardTitle>
        </CardHeader>
        <CardContent>
          <LoginTabs 
            onEmailSubmit={handleEmailSubmit}
            onMemberIdSubmit={handleMemberIdSubmit}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}