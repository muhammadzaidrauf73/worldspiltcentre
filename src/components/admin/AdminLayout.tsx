import { ReactNode } from "react";
import { Link, useLocation, Navigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  LayoutDashboard, 
  Package, 
  FolderTree, 
  ShoppingCart, 
  ArrowLeft,
  Loader2,
  Tags,
  Mail,
  ImageIcon,
  Truck,
  Zap,
  Settings,
  Sparkles,
  HelpCircle,
  Users,
  MessageSquare,
  Ticket,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/brands", label: "Brands", icon: Tags },
  { href: "/admin/banners", label: "Banners", icon: ImageIcon },
  { href: "/admin/flash-deals", label: "Flash Deals", icon: Zap },
  { href: "/admin/featured-sections", label: "Featured Sections", icon: Sparkles },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquare },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket },
  { href: "/admin/coupon-analytics", label: "Coupon Analytics", icon: BarChart3 },
  { href: "/admin/shipping", label: "Shipping", icon: Truck },
  { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
  { href: "/admin/faq", label: "FAQ", icon: HelpCircle },
  { href: "/admin/company-settings", label: "Company Settings", icon: Settings },
];

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const { isAdmin, loading } = useAdmin();
  const { user, loading: authLoading } = useAuth();

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You don't have permission to access this area.</p>
          <Link to="/" className="text-primary hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center border-b border-border px-6">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back to Store</span>
            </Link>
          </div>

          {/* Logo */}
          <div className="px-6 py-4">
            <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
          </div>

          {/* Navigation with Scroll */}
          <ScrollArea className="flex-1 px-3">
            <nav className="space-y-1 py-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>
        </div>
      </aside>

      {/* Main Content */}
      <main className="pl-64">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
