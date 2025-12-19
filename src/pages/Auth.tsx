import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, CheckCircle } from "lucide-react";
import { z } from "zod";
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});

  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; fullName?: string } = {};

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    if (!isForgotPassword) {
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        newErrors.password = passwordResult.error.errors[0].message;
      }

      if (!isLogin && fullName.trim().length < 2) {
        newErrors.fullName = "Please enter your full name";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setErrors({ email: emailResult.error.errors[0].message });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.functions.invoke("send-password-reset", {
        body: {
          email,
          redirectTo: `${window.location.origin}/reset-password`,
        },
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
      } else {
        setResetEmailSent(true);
        toast({
          title: "Email sent!",
          description: "Check your inbox for the password reset link.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              variant: "destructive",
              title: "Login failed",
              description: "Invalid email or password. Please try again.",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Login failed",
              description: error.message,
            });
          }
        } else {
          toast({
            title: "Welcome back!",
            description: "You have successfully logged in.",
          });
          navigate("/");
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes("User already registered")) {
            toast({
              variant: "destructive",
              title: "Sign up failed",
              description: "An account with this email already exists. Please login instead.",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Sign up failed",
              description: error.message,
            });
          }
        } else {
          // Send welcome email
          try {
            await supabase.functions.invoke('send-welcome-email', {
              body: {
                email: email,
                name: fullName || undefined,
              },
            });
            console.log("Welcome email sent");
          } catch (emailError) {
            console.error("Failed to send welcome email:", emailError);
            // Don't fail signup if email fails
          }

          toast({
            title: "Account created!",
            description: "Welcome to World Spilt Centre Electronics. Check your email!",
          });
          navigate("/");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password - Email Sent Success View
  if (resetEmailSent) {
    return (
      <>
        <SEO
          title="Check Your Email - World Spilt Centre"
          description="Password reset instructions have been sent to your email."
        />
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-accent" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-foreground mb-2">
              Check your email
            </h1>
            <p className="text-muted-foreground mb-6">
              We've sent a password reset link to <strong>{email}</strong>. 
              Click the link in the email to reset your password.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Didn't receive the email? Check your spam folder or{" "}
              <button
                onClick={() => {
                  setResetEmailSent(false);
                  setIsForgotPassword(true);
                }}
                className="text-primary hover:underline"
              >
                try again
              </button>
            </p>
            <Button
              onClick={() => {
                setResetEmailSent(false);
                setIsForgotPassword(false);
                setIsLogin(true);
              }}
              variant="outline"
              className="w-full"
            >
              Back to login
            </Button>
          </div>
        </div>
      </>
    );
  }

  // Forgot Password Form View
  if (isForgotPassword) {
    return (
      <>
        <SEO
          title="Forgot Password - World Spilt Centre"
          description="Reset your World Spilt Centre account password."
        />
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
          <div className="max-w-md w-full">
            <button
              onClick={() => setIsForgotPassword(false)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-smooth"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </button>

            <Link to="/" className="flex items-center gap-2 mb-8">
              <img 
                src="/logo.png" 
                alt="World Spilt Centre" 
                className="h-10 w-auto object-contain"
              />
              <div>
                <h1 className="font-heading font-bold text-lg text-foreground">
                  World <span className="text-primary">Spilt</span> Centre
                </h1>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Electronics</p>
              </div>
            </Link>

            <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
              Forgot your password?
            </h2>
            <p className="text-muted-foreground mb-8">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
                  />
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title={isLogin ? "Login - World Spilt Centre" : "Sign Up - World Spilt Centre"}
        description="Sign in or create an account at World Spilt Centre to track orders, save favorites, and get exclusive deals on electronics."
        keywords="login, sign up, create account, world spilt centre account, electronics store login"
      />
      <div className="min-h-screen bg-background flex">
        {/* Left Side - Form */}
        <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 py-6 sm:py-0">
          <div className="mx-auto w-full max-w-sm">
            <Link
              to="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 sm:mb-8 transition-smooth"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to store
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
              {isLogin ? "Welcome back" : "Create an account"}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-8">
              {isLogin ? "Enter your credentials to access your account" : "Sign up to start shopping with us"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={`pl-10 ${errors.fullName ? "border-destructive" : ""}`}
                    />
                  </div>
                  {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
                  />
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
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
                {!isLogin && <PasswordStrengthIndicator password={password} />}
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isLoading}
              >
                {isLoading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
              </Button>
            </form>

            <p className="mt-4 sm:mt-6 text-center text-sm text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                }}
                className="text-primary font-medium hover:underline"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>

        {/* Right Side - Image */}
        <div className="hidden lg:block relative w-0 flex-1 overflow-hidden">
          <img 
            src="/banners/led-tv.jpg" 
            alt="Premium Electronics" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-12">
            <div className="text-white max-w-md">
              <h2 className="text-3xl font-heading font-bold mb-4">Shop Premium Electronics</h2>
              <p className="text-white/80 mb-6">
                Discover the latest in home appliances, TVs, smartphones, and more. Quality guaranteed with the best
                after-sales service.
              </p>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">500+</div>
                  <div className="text-sm text-white/70">Products</div>
                </div>
                <div className="w-px h-10 bg-white/30" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">15+</div>
                  <div className="text-sm text-white/70">Brands</div>
                </div>
                <div className="w-px h-10 bg-white/30" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">24/7</div>
                  <div className="text-sm text-white/70">Support</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Auth;
