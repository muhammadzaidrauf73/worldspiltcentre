import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import ScrollToTop from "@/components/ScrollToTop";
import WhatsAppButton from "@/components/WhatsAppButton";
import BackToTop from "@/components/BackToTop";
import PageLoader from "@/components/PageLoader";
import RouteLoadingBar from "@/components/RouteLoadingBar";
import WelcomePopup from "@/components/WelcomePopup";
import Index from "./pages/Index";

// Critical pages - preloaded for instant navigation
const authImport = () => import("./pages/Auth");
const productsImport = () => import("./pages/Products");
const productDetailImport = () => import("./pages/ProductDetail");
const cartImport = () => import("./pages/Cart");

const Auth = lazy(authImport);
const Products = lazy(productsImport);
const ProductDetail = lazy(productDetailImport);
const Cart = lazy(cartImport);

// Preload critical pages after initial render
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // Preload after page is fully loaded
    setTimeout(() => {
      authImport();
      productsImport();
      cartImport();
    }, 1000);
    
    // Preload product detail slightly later
    setTimeout(() => {
      productDetailImport();
    }, 2000);
  }, { once: true });
}

// Other lazy loaded pages
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Account = lazy(() => import("./pages/Account"));
const Profile = lazy(() => import("./pages/Profile"));
const Orders = lazy(() => import("./pages/Orders"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Checkout = lazy(() => import("./pages/Checkout"));
const NotFound = lazy(() => import("./pages/NotFound"));
const About = lazy(() => import("./pages/About"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Returns = lazy(() => import("./pages/Returns"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const Warranty = lazy(() => import("./pages/Warranty"));
const Shipping = lazy(() => import("./pages/Shipping"));
const Contact = lazy(() => import("./pages/Contact"));
const StoreLocations = lazy(() => import("./pages/StoreLocations"));
const Careers = lazy(() => import("./pages/Careers"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const OrderTracking = lazy(() => import("./pages/OrderTracking"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
// Admin pages - lazy loaded
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminProducts = lazy(() => import("./pages/admin/Products"));
const AdminCategories = lazy(() => import("./pages/admin/Categories"));
const AdminBrands = lazy(() => import("./pages/admin/Brands"));
const AdminBanners = lazy(() => import("./pages/admin/Banners"));
const AdminOrders = lazy(() => import("./pages/admin/Orders"));
const AdminNewsletter = lazy(() => import("./pages/admin/Newsletter"));
const AdminShipping = lazy(() => import("./pages/admin/Shipping"));
const AdminFlashDeals = lazy(() => import("./pages/admin/FlashDeals"));
const AdminCompanySettings = lazy(() => import("./pages/admin/CompanySettings"));
const AdminNewArrivalsTopSellers = lazy(() => import("./pages/admin/NewArrivalsTopSellers"));
const AdminFAQ = lazy(() => import("./pages/admin/FAQ"));
const AdminCustomers = lazy(() => import("./pages/admin/Customers"));
const AdminReviews = lazy(() => import("./pages/admin/Reviews"));
const AdminMessages = lazy(() => import("./pages/admin/Messages"));
const AdminCoupons = lazy(() => import("./pages/admin/Coupons"));
const AdminCouponAnalytics = lazy(() => import("./pages/admin/CouponAnalytics"));
const AdminCancellationRequests = lazy(() => import("./pages/admin/CancellationRequests"));
const AdminProductImport = lazy(() => import("./pages/admin/ProductImport"));
const AdminHomepageSections = lazy(() => import("./pages/admin/HomepageSections"));
const AdminFreeDelivery = lazy(() => import("./pages/admin/FreeDelivery"));
const AdminStoreLocations = lazy(() => import("./pages/admin/StoreLocations"));
const AdminBlog = lazy(() => import("./pages/admin/Blog"));
const AdminNotifications = lazy(() => import("./pages/admin/Notifications"));
const AdminPaymentMethods = lazy(() => import("./pages/admin/PaymentMethods"));
const AdminOfflineReceipt = lazy(() => import("./pages/admin/OfflineReceipt"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      gcTime: 1000 * 60 * 5, // 5 minutes (formerly cacheTime)
    },
  },
});

// WhatsApp button wrapper that hides on admin pages
const ConditionalWhatsAppButton = () => {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  
  if (isAdminPage) return null;
  return <WhatsAppButton />;
};

// Welcome popup wrapper that hides on admin pages
const ConditionalWelcomePopup = () => {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  
  if (isAdminPage) return null;
  return <WelcomePopup />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <RouteLoadingBar />
          <ConditionalWhatsAppButton />
          <ConditionalWelcomePopup />
          <BackToTop />
          <ScrollToTop />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/account" element={<Account />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/products" element={<Products />} />
              <Route path="/product/:slug" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/about" element={<About />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/returns" element={<Returns />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />
              <Route path="/warranty" element={<Warranty />} />
              <Route path="/shipping" element={<Shipping />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/store-locations" element={<StoreLocations />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/order-tracking" element={<OrderTracking />} />
              <Route path="/order-tracking/:orderId" element={<OrderTracking />} />
              <Route path="/order-confirmation" element={<OrderConfirmation />} />
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
              <Route path="/admin/reviews" element={<AdminReviews />} />
              <Route path="/admin/messages" element={<AdminMessages />} />
              <Route path="/admin/coupons" element={<AdminCoupons />} />
              <Route path="/admin/coupon-analytics" element={<AdminCouponAnalytics />} />
              <Route path="/admin/cancellation-requests" element={<AdminCancellationRequests />} />
              <Route path="/admin/product-import" element={<AdminProductImport />} />
              <Route path="/admin/homepage-sections" element={<AdminHomepageSections />} />
              <Route path="/admin/free-delivery" element={<AdminFreeDelivery />} />
              <Route path="/admin/store-locations" element={<AdminStoreLocations />} />
              <Route path="/admin/blog" element={<AdminBlog />} />
              <Route path="/admin/notifications" element={<AdminNotifications />} />
              <Route path="/admin/payment-methods" element={<AdminPaymentMethods />} />
              <Route path="/admin/offline-receipt" element={<AdminOfflineReceipt />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
