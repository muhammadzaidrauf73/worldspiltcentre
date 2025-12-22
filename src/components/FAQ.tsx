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
import { HelpCircle } from "lucide-react";
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
      <section className="py-8 sm:py-12 relative overflow-hidden" id="faq">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-accent/3" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col items-center mb-6">
              <Skeleton className="h-12 w-12 rounded-xl mb-3" />
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (faqs.length === 0) return null;

  return (
    <section className="py-8 sm:py-12 relative overflow-hidden" id="faq">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-accent/3" />
      
      {/* Subtle orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 left-1/3 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 right-1/3 w-[400px] h-[400px] bg-accent/3 rounded-full blur-3xl" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/20">
                <HelpCircle className="h-5 w-5 sm:h-6 sm:w-6 text-accent-foreground" />
              </div>
            </div>
            
            <h2 className="text-xl sm:text-2xl md:text-3xl font-heading font-bold text-foreground mb-1">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-muted-foreground">
              Find answers to common questions
            </p>
          </div>

          {/* FAQ Accordion */}
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={faq.id}
                value={`item-${index}`}
                className="group bg-card backdrop-blur-sm rounded-2xl border border-border px-5 shadow-md hover:shadow-lg hover:border-accent/30 transition-all duration-300 animate-fade-in overflow-hidden"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <AccordionTrigger className="text-left font-semibold text-foreground hover:text-accent py-4 text-sm gap-4 [&[data-state=open]]:text-accent">
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 w-7 h-7 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                      <span className="text-xs font-bold text-primary">
                        {index + 1}
                      </span>
                    </div>
                    <span>{faq.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4 text-sm prose prose-sm dark:prose-invert max-w-none pl-10">
                  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(faq.answer) }} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
});

FAQ.displayName = "FAQ";

export default FAQ;
