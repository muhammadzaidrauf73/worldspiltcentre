import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import { Eye, EyeOff, Lock, ArrowLeft, CheckCircle, RefreshCw, Mail } from "lucide-react";
import { z } from "zod";
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator";

const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isResending, setIsResending] = useState(false);
  const [showResendForm, setShowResendForm] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleResendEmail = async () => {
    if (!resendEmail) {
      toast({
        variant: "destructive",
        title: "Email required",
        description: "Please enter your email address.",
      });
      return;
    }

    setIsResending(true);
    try {
      const { error } = await supabase.functions.invoke("send-password-reset", {
        body: { email: resendEmail },
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Failed to send email",
          description: error.message,
        });
      } else {
        toast({
          title: "Email sent!",
          description: "Check your inbox for the password reset link.",
        });
        setShowResendForm(false);
        setResendEmail("");
      }
    } finally {
      setIsResending(false);
    }
  };

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setIsCheckingSession(false);
      }
    });

    // Give Supabase time to process the recovery tokens from URL
    timeoutId = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          variant: "destructive",
          title: "Invalid or expired link",
          description: "Please request a new password reset link.",
        });
        navigate("/auth");
      } else {
        setIsCheckingSession(false);
      }
    }, 2000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [navigate, toast]);

  const validateForm = () => {
    const newErrors: { password?: string; confirmPassword?: string } = {};

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast({
          variant: "destructive",
          title: "Password reset failed",
          description: error.message,
        });
      } else {
        setIsSuccess(true);
        toast({
          title: "Password updated!",
          description: "Your password has been successfully reset.",
        });
        
        // Sign out and redirect to login after a delay
        setTimeout(async () => {
          await supabase.auth.signOut();
          navigate("/auth");
        }, 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <>
        <SEO
          title="Reset Password - World Spilt Centre"
          description="Set a new password for your World Spilt Centre account."
        />
        <div className="min-h-screen bg-background flex items-center justify-center px-4 py-6">
          <div className="text-center max-w-md w-full">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">Verifying reset link...</p>
            
            {/* Resend email option */}
            <div className="border-t border-border pt-4 sm:pt-6 mt-4 sm:mt-6">
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                Link expired or didn't receive the email?
              </p>
              {showResendForm ? (
                <div className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleResendEmail}
                      disabled={isResending}
                      className="flex-1"
                    >
                      {isResending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send Reset Link"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowResendForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowResendForm(true)}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Request New Link
                </Button>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (isSuccess) {
    return (
      <>
        <SEO
          title="Password Reset Successful - World Spilt Centre"
          description="Your password has been reset successfully."
        />
        <div className="min-h-screen bg-background flex items-center justify-center px-4 py-6">
          <div className="max-w-md w-full text-center">
            <div className="w-12 sm:w-16 h-12 sm:h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <CheckCircle className="h-6 sm:h-8 w-6 sm:w-8 text-accent" />
            </div>
            <h1 className="text-xl sm:text-2xl font-heading font-bold text-foreground mb-1 sm:mb-2">
              Password Reset Successful!
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
              Your password has been updated. Redirecting you to login...
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title="Reset Password - World Spilt Centre"
        description="Set a new password for your World Spilt Centre account."
      />
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-6">
        <div className="max-w-md w-full">
          <Link
            to="/auth"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 sm:mb-8 transition-smooth"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>

          <Link to="/" className="flex items-center gap-2 mb-4 sm:mb-8">
            <img 
              src="/logo.png" 
              alt="World Spilt Centre" 
              className="h-8 sm:h-10 w-auto object-contain"
            />
            <div>
              <h1 className="font-heading font-bold text-base sm:text-lg text-foreground">
                World <span className="text-primary">Spilt</span> Centre
              </h1>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Electronics</p>
            </div>
          </Link>

          <h2 className="text-xl sm:text-2xl font-heading font-bold text-foreground mb-1 sm:mb-2">
            Set new password
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-8">
            Enter your new password below.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`pl-10 pr-10 ${errors.password ? "border-destructive" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              <PasswordStrengthIndicator password={password} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`pl-10 pr-10 ${errors.confirmPassword ? "border-destructive" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isLoading}
            >
              {isLoading ? "Updating password..." : "Reset Password"}
            </Button>
          </form>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
