import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Account from "./pages/Account";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Returns from "./pages/Returns";
import Warranty from "./pages/Warranty";
import Shipping from "./pages/Shipping";
import Contact from "./pages/Contact";
import StoreLocations from "./pages/StoreLocations";
import Careers from "./pages/Careers";
import Blog from "./pages/Blog";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import AdminCategories from "./pages/admin/Categories";
import AdminBrands from "./pages/admin/Brands";
import AdminBanners from "./pages/admin/Banners";
import AdminOrders from "./pages/admin/Orders";
import AdminNewsletter from "./pages/admin/Newsletter";
import AdminShipping from "./pages/admin/Shipping";
import AdminFlashDeals from "./pages/admin/FlashDeals";
import AdminCompanySettings from "./pages/admin/CompanySettings";
import AdminNewArrivalsTopSellers from "./pages/admin/NewArrivalsTopSellers";
import AdminFAQ from "./pages/admin/FAQ";
import AdminCustomers from "./pages/admin/Customers";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/account" element={<Account />} />
            <Route path="/products" element={<Products />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/about" element={<About />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/returns" element={<Returns />} />
            <Route path="/warranty" element={<Warranty />} />
            <Route path="/shipping" element={<Shipping />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/store-locations" element={<StoreLocations />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/brands" element={<AdminBrands />} />
            <Route path="/admin/banners" element={<AdminBanners />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/newsletter" element={<AdminNewsletter />} />
            <Route path="/admin/shipping" element={<AdminShipping />} />
            <Route path="/admin/flash-deals" element={<AdminFlashDeals />} />
            <Route path="/admin/company-settings" element={<AdminCompanySettings />} />
            <Route path="/admin/featured-sections" element={<AdminNewArrivalsTopSellers />} />
            <Route path="/admin/faq" element={<AdminFAQ />} />
            <Route path="/admin/customers" element={<AdminCustomers />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
