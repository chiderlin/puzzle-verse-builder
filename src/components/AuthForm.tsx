
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AuthFormProps {
  mode: "login" | "register";
  onSubmit: (email: string, password: string) => Promise<void>;
  onToggle: () => void;
}

export const AuthForm = ({ mode, onSubmit, onToggle }: AuthFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      // If registering, extract username from email and update profiles table
      if (mode === "register") {
        // First, try to sign up the user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (authError) throw authError;

        if (authData.user) {
          const username = email.split('@')[0]; // Extract username from email
          // Update the profiles table with email and display_name
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              email: email,
              display_name: username
            })
            .eq('id', authData.user.id);

          if (updateError) throw updateError;
        }
      } else {
        // If logging in, just use the regular onSubmit
        await onSubmit(email, password);
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Authentication failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 animate-fade-in">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">
          {mode === "login" ? "Welcome back" : "Create an account"}
        </h2>
        <p className="text-sm text-slate-600 mt-2">
          {mode === "login"
            ? "Enter your credentials to access your account"
            : "Sign up to save your progress and compete with others"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Loading..." : mode === "login" ? "Sign In" : "Sign Up"}
        </Button>
      </form>

      <div className="text-center text-sm">
        <span className="text-slate-600">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
        </span>
        <button
          onClick={onToggle}
          className="text-primary hover:underline font-medium"
          disabled={isLoading}
        >
          {mode === "login" ? "Sign Up" : "Sign In"}
        </button>
      </div>
    </div>
  );
};
