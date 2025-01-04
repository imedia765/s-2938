import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { verifyMember, signInMember, createAuthAccount, linkMemberToAuth } from '@/utils/auth';

const LoginForm = () => {
  const [memberNumber, setMemberNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Starting login process for member:', memberNumber);
      
      // Step 1: Verify member exists
      const member = await verifyMember(memberNumber);
      console.log('Member found:', member);

      let authUser;
      
      // Step 2: Check if member already has an auth account
      if (!member.auth_user_id) {
        // If no auth account exists, create one
        console.log('No auth account found, creating new account');
        authUser = await createAuthAccount(memberNumber);
        
        if (authUser) {
          console.log('Linking member to auth account:', authUser.id);
          await linkMemberToAuth(member.id, authUser.id);
        }
      } else {
        // If auth account exists, try to sign in
        console.log('Auth account exists, attempting sign in');
        authUser = await signInMember(memberNumber);
      }

      if (!authUser) {
        throw new Error('Authentication failed');
      }

      toast({
        title: "Login successful",
        description: "Welcome back!",
      });

      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      
      let errorMessage = "An unexpected error occurred";
      if (error.message.includes('Member not found')) {
        errorMessage = "Member number not found. Please check your member number.";
      } else if (error.message.includes('Invalid login credentials')) {
        errorMessage = "Invalid credentials. Please try again.";
      } else if (error.message.includes('already registered')) {
        errorMessage = "This member number is already registered. Please try logging in.";
      }
      
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-dashboard-card rounded-lg shadow-lg p-8 mb-12">
      <form onSubmit={handleLogin} className="space-y-6 max-w-md mx-auto">
        <div>
          <label htmlFor="memberNumber" className="block text-sm font-medium text-dashboard-text mb-2">
            Member Number
          </label>
          <Input
            id="memberNumber"
            type="text"
            value={memberNumber}
            onChange={(e) => setMemberNumber(e.target.value)}
            placeholder="Enter your member number"
            className="w-full"
            required
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-dashboard-accent1 hover:bg-dashboard-accent1/90"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </Button>
      </form>
    </div>
  );
};

export default LoginForm;