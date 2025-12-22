import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { FileText, Calendar, User, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Blog = () => {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Blog - Electronics Tips & Guides | World Spilt Centre"
        description="Read helpful articles, buying guides, and tips about electronics and home appliances. Learn how to choose the right AC, TV, refrigerator for your home."
        keywords="electronics blog, AC buying guide pakistan, LED TV tips, refrigerator guide, home appliances blog lahore, World Spilt Centre"
      />
      <Navbar />

      <section className="bg-gradient-to-r from-primary to-primary/80 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Electronics Blog
          </h1>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto">
            Tips, buying guides, and expert advice to help you make the best purchasing decisions
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-secondary" />
                  <CardHeader>
                    <div className="h-6 bg-secondary rounded w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-secondary rounded mb-2" />
                    <div className="h-4 bg-secondary rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : posts?.length === 0 ? (
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
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts?.map((post) => (
                <Card key={post.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                  <Link to={`/blog/${post.slug}`}>
                    {post.featured_image ? (
                      <div className="h-48 overflow-hidden">
                        <img
                          src={post.featured_image}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="h-48 bg-secondary flex items-center justify-center">
                        <FileText className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </Link>
                  <CardHeader>
                    <Link to={`/blog/${post.slug}`}>
                      <h2 className="text-xl font-semibold hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </h2>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    {post.excerpt && (
                      <p className="text-muted-foreground line-clamp-3 mb-4">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{post.author_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {format(new Date(post.published_at || post.created_at), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Link
                      to={`/blog/${post.slug}`}
                      className="text-primary hover:underline inline-flex items-center gap-1 text-sm font-medium"
                    >
                      Read More
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Blog;
