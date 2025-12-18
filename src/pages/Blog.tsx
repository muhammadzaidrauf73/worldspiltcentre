import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { FileText } from "lucide-react";

const Blog = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Blog - Electronics Tips & Guides"
        description="Read helpful articles, buying guides, and tips about electronics and home appliances. Learn how to choose the right AC, TV, refrigerator for your home."
        keywords="electronics blog, AC buying guide pakistan, LED TV tips, refrigerator guide, home appliances blog lahore"
      />
      <Navbar />
      
      <section className="bg-gradient-to-r from-primary to-primary/80 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Blog
          </h1>
          <p className="text-primary-foreground/80">
            Tips, guides, and news about electronics
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-secondary/30 rounded-lg p-12 text-center">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-4">Coming Soon</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                We're working on bringing you helpful articles, product guides, and tips 
                to help you make the best purchasing decisions. Stay tuned!
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Blog;