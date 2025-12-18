import { AirVent, Tv, WashingMachine, Refrigerator, Microwave, Flame, Droplets, ThermometerSun, LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import AnnouncementTicker from "@/components/AnnouncementTicker";
import FeaturesBar from "@/components/FeaturesBar";
import CategoryCard from "@/components/CategoryCard";
import ProductCard from "@/components/ProductCard";
import CustomerReviews from "@/components/CustomerReviews";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import TopSellers from "@/components/TopSellers";
import FeaturedBrands from "@/components/FeaturedBrands";
import NewArrivals from "@/components/NewArrivals";
import FlashDeal from "@/components/FlashDeal";
import Newsletter from "@/components/Newsletter";

// Mock data for categories with circular images
const categories = [
  { id: "1", name: "Air Conditioner", icon: "AirVent", product_count: 45, image_url: "https://images.unsplash.com/photo-1631545806609-11e3a851df1e?w=200&h=200&fit=crop" },
  { id: "2", name: "Air Fryer", icon: "Flame", product_count: 28, image_url: "https://images.unsplash.com/photo-1585515320310-259814833e62?w=200&h=200&fit=crop" },
  { id: "3", name: "Refrigerator", icon: "Refrigerator", product_count: 56, image_url: "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=200&h=200&fit=crop" },
  { id: "4", name: "Washing", icon: "WashingMachine", product_count: 34, image_url: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=200&h=200&fit=crop" },
  { id: "5", name: "LED TV", icon: "Tv", product_count: 89, image_url: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=200&h=200&fit=crop" },
  { id: "6", name: "Microwave", icon: "Microwave", product_count: 23, image_url: "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=200&h=200&fit=crop" },
  { id: "7", name: "Geyser", icon: "ThermometerSun", product_count: 18, image_url: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=200&h=200&fit=crop" },
  { id: "8", name: "Water Dispenser", icon: "Droplets", product_count: 15, image_url: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=200&h=200&fit=crop" },
  { id: "9", name: "Small Electronics", icon: "Flame", product_count: 67, image_url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop" },
  { id: "10", name: "Heater", icon: "ThermometerSun", product_count: 12, image_url: "https://images.unsplash.com/photo-1544473244-b7b4e4e2c4f7?w=200&h=200&fit=crop" },
];

// Mock data for featured products
const featuredProducts = [
  {
    id: "p1",
    name: "Samsung 55\" Crystal 4K UHD Smart TV",
    brand: "Samsung",
    price: 99999,
    originalPrice: 139999,
    image_url: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=300",
    rating: 4.7,
    reviews: 1234,
    discount_percentage: 29,
    is_featured: true,
  },
  {
    id: "p2",
    name: "LG 1.5 Ton 5 Star Inverter Split AC",
    brand: "LG",
    price: 89999,
    originalPrice: 119999,
    image_url: "https://images.unsplash.com/photo-1631545806609-11e3a851df1e?w=300",
    rating: 4.5,
    reviews: 856,
    discount_percentage: 25,
    is_featured: true,
  },
  {
    id: "p3",
    name: "Whirlpool 7.5kg Fully Automatic Washing Machine",
    brand: "Whirlpool",
    price: 69999,
    originalPrice: 89999,
    image_url: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=300",
    rating: 4.6,
    reviews: 567,
    discount_percentage: 22,
    is_featured: true,
  },
  {
    id: "p4",
    name: "Samsung 253L Double Door Refrigerator",
    brand: "Samsung",
    price: 79999,
    originalPrice: 109999,
    image_url: "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=300",
    rating: 4.4,
    reviews: 423,
    discount_percentage: 27,
    is_featured: true,
  },
  {
    id: "p5",
    name: "Sony Bravia 43\" Full HD Smart LED TV",
    brand: "Sony",
    price: 75999,
    originalPrice: 99999,
    image_url: "https://images.unsplash.com/photo-1461151304267-38535e780c79?w=300",
    rating: 4.8,
    reviews: 912,
    discount_percentage: 24,
    is_featured: true,
  },
  {
    id: "p6",
    name: "Bosch 6.5kg Front Load Washing Machine",
    brand: "Bosch",
    price: 109999,
    originalPrice: 139999,
    image_url: "https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?w=300",
    rating: 4.7,
    reviews: 345,
    discount_percentage: 21,
    is_featured: true,
  },
  {
    id: "p7",
    name: "Panasonic 1 Ton Inverter Split AC",
    brand: "Panasonic",
    price: 77999,
    originalPrice: 99999,
    image_url: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=300",
    rating: 4.3,
    reviews: 234,
    discount_percentage: 22,
    is_featured: true,
  },
  {
    id: "p8",
    name: "LG 260L Triple Door Refrigerator",
    brand: "LG",
    price: 105999,
    originalPrice: 139999,
    image_url: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=300",
    rating: 4.6,
    reviews: 678,
    discount_percentage: 24,
    is_featured: true,
  },
];

// Mock washing machines data
const washingMachines = [
  {
    id: "wm1",
    name: "Samsung 8kg Front Load Washing Machine",
    brand: "Samsung",
    price: 119999,
    originalPrice: 159999,
    image_url: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=300",
    rating: 4.8,
    reviews: 456,
    discount_percentage: 25,
  },
  {
    id: "wm2",
    name: "LG 7kg Fully Automatic Top Load",
    brand: "LG",
    price: 69999,
    originalPrice: 89999,
    image_url: "https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?w=300",
    rating: 4.5,
    reviews: 324,
    discount_percentage: 22,
  },
  {
    id: "wm3",
    name: "Bosch 8kg Front Load with AI",
    brand: "Bosch",
    price: 149999,
    originalPrice: 179999,
    image_url: "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=300",
    rating: 4.9,
    reviews: 189,
    discount_percentage: 17,
  },
  {
    id: "wm4",
    name: "Whirlpool 6.5kg Semi Automatic",
    brand: "Whirlpool",
    price: 49999,
    originalPrice: 65999,
    image_url: "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=300",
    rating: 4.3,
    reviews: 567,
    discount_percentage: 24,
  },
];

const iconMap: Record<string, LucideIcon> = {
  "AirVent": AirVent,
  "Tv": Tv,
  "WashingMachine": WashingMachine,
  "Refrigerator": Refrigerator,
  "Microwave": Microwave,
  "Flame": Flame,
  "Droplets": Droplets,
  "ThermometerSun": ThermometerSun,
};

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <AnnouncementTicker />
      <Hero />
      <FeaturesBar />

      {/* Top Categories */}
      <section className="py-8 bg-secondary/30" id="categories">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-heading font-bold text-foreground">
                Top Categories
              </h2>
              <p className="text-sm text-muted-foreground">
                Browse our wide range of electronics
              </p>
            </div>
            <Link
              to="/products"
              className="text-primary text-sm font-semibold hover:underline transition-smooth hidden md:block"
            >
              View All →
            </Link>
          </div>

          {/* Horizontal Scroll Container */}
          <div className="relative">
            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide scroll-smooth">
              {categories.map((category, index) => (
                <div
                  key={category.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <CategoryCard
                    name={category.name}
                    icon={iconMap[category.icon] || Tv}
                    count={category.product_count}
                    image={category.image_url}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <FlashDeal />

      {/* Hot Deals - Featured Products */}
      <section className="py-10 bg-card">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded text-xs font-bold">
                  Hot Deals
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-heading font-bold text-foreground">
                Featured Products
              </h2>
            </div>
            <Link
              to="/products"
              className="text-primary font-semibold hover:underline transition-smooth text-sm"
            >
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {featuredProducts.map((product, index) => (
              <Link key={product.id} to={`/product/${product.id}`}>
                <ProductCard
                  id={product.id}
                  name={product.name}
                  brand={product.brand}
                  price={product.price}
                  originalPrice={product.originalPrice}
                  image={product.image_url}
                  rating={product.rating}
                  reviews={product.reviews}
                  badge={product.discount_percentage ? `${product.discount_percentage}% OFF` : undefined}
                  index={index}
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Washing Machines Section */}
      <section className="py-10 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-xl md:text-2xl font-heading font-bold text-foreground">
              Washing Machines
            </h2>
            <Link
              to="/products?category=Washing%20Machines"
              className="text-primary font-semibold hover:underline transition-smooth text-sm"
            >
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {washingMachines.map((product, index) => (
              <Link key={product.id} to={`/product/${product.id}`}>
                <ProductCard
                  id={product.id}
                  name={product.name}
                  brand={product.brand}
                  price={product.price}
                  originalPrice={product.originalPrice}
                  image={product.image_url}
                  rating={product.rating}
                  reviews={product.reviews}
                  badge={product.discount_percentage ? `${product.discount_percentage}% OFF` : undefined}
                  index={index}
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Promo Banner */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-xl gradient-hero p-8 md:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15)_0%,_transparent_60%)]" />
            <div className="relative z-10 max-w-lg">
              <span className="inline-block px-3 py-1 rounded bg-primary-foreground/20 text-primary-foreground text-sm font-semibold mb-3">
                Limited Time Offer
              </span>
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-primary-foreground mb-3">
                Best Price Guaranteed!
              </h2>
              <p className="text-primary-foreground/80 mb-5 text-sm md:text-base">
                Found a lower price elsewhere? We'll match it! Shop with confidence at Ayan & Co Electronics.
              </p>
              <Link to="/products">
                <button className="bg-primary-foreground text-primary font-semibold px-5 py-2.5 rounded-lg hover:bg-primary-foreground/90 transition-smooth text-sm">
                  Shop Now
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <NewArrivals />
      <FeaturedBrands />
      <TopSellers />
      <CustomerReviews />
      <Newsletter />
      <FAQ />
      <Footer />
    </div>
  );
};

export default Index;
