import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DOMPurify from "dompurify";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, MessageCircleQuestion, Sparkles, Lightbulb } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const FAQ = memo(() => {
  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ["faqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <section className="py-8 sm:py-14 relative overflow-hidden" id="faq">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-accent/3" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col items-center mb-8">
              <Skeleton className="h-16 w-16 rounded-xl mb-4" />
              <Skeleton className="h-10 w-72 mb-2" />
              <Skeleton className="h-5 w-48" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (faqs.length === 0) return null;

  return (
    <section className="py-8 sm:py-14 relative overflow-hidden" id="faq">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-accent/3" />
      
      {/* Subtle orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 left-1/3 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 right-1/3 w-[400px] h-[400px] bg-accent/3 rounded-full blur-3xl" />
      </div>

      {/* Floating decorations */}
      <div className="absolute top-20 left-[10%] opacity-15">
        <Lightbulb className="h-7 w-7 text-primary animate-pulse" style={{ animationDuration: '2s' }} />
      </div>
      <div className="absolute bottom-24 right-[12%] opacity-15">
        <MessageCircleQuestion className="h-8 w-8 text-accent animate-bounce" style={{ animationDuration: '3s' }} />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8 sm:mb-10">
            <div className="flex items-center gap-4 sm:gap-5 mb-4">
              {/* Animated icon */}
              <div className="relative group">
                <div className="absolute -inset-3 bg-accent/20 rounded-2xl blur-lg group-hover:bg-accent/30 transition-all duration-500" />
                <div className="absolute -inset-1 bg-accent rounded-2xl opacity-75 animate-spin" style={{ animationDuration: '8s' }} />
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-accent flex items-center justify-center shadow-2xl shadow-accent/30">
                  <HelpCircle className="h-7 w-7 sm:h-8 sm:w-8 text-accent-foreground drop-shadow-lg" />
                </div>
                <Sparkles className="absolute -top-2 -right-2 h-5 w-5 text-primary drop-shadow-lg animate-pulse" style={{ animationDuration: '1.5s' }} />
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap justify-center mb-2">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-foreground">
                Frequently Asked Questions
              </h2>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent/10 text-accent text-[10px] sm:text-xs font-bold border border-accent/30 backdrop-blur-sm">
                <MessageCircleQuestion className="h-3 w-3" />
                HELP
              </span>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-accent animate-pulse shadow-lg shadow-accent/50" />
              Find answers to common questions
            </p>
          </div>

          {/* FAQ Accordion */}
          <Accordion type="single" collapsible className="space-y-3 sm:space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={faq.id}
                value={`item-${index}`}
                className="group bg-card backdrop-blur-sm rounded-2xl border border-border px-5 sm:px-6 shadow-lg hover:shadow-xl hover:border-accent/30 transition-all duration-300 animate-fade-in overflow-hidden"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <AccordionTrigger className="text-left font-semibold text-foreground hover:text-accent py-4 sm:py-5 text-sm sm:text-base gap-4 [&[data-state=open]]:text-accent">
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                      <span className="text-sm font-bold text-primary">
                        {index + 1}
                      </span>
                    </div>
                    <span>{faq.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 sm:pb-6 text-sm sm:text-base prose prose-sm dark:prose-invert max-w-none pl-11">
                  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(faq.answer) }} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Bottom help text */}
          <div className="mt-6 sm:mt-8 text-center">
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-card backdrop-blur-md border border-border shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                <MessageCircleQuestion className="h-5 w-5 text-accent-foreground" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">Still have questions?</p>
                <p className="text-xs text-muted-foreground">Contact our support team for help</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

FAQ.displayName = "FAQ";

export default FAQ;
