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
      <section className="py-10 sm:py-14" id="faq">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col items-center mb-6">
              <Skeleton className="h-10 w-10 rounded-lg mb-3" />
              <Skeleton className="h-7 w-56 mb-2" />
              <Skeleton className="h-4 w-36" />
            </div>
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (faqs.length === 0) return null;

  return (
    <section className="py-10 sm:py-14" id="faq">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center mb-3">
              <HelpCircle className="h-5 w-5 text-primary-foreground" />
            </div>
            
            <h2 className="text-xl sm:text-2xl font-heading font-bold text-foreground">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Find answers to common questions
            </p>
          </div>

          {/* FAQ Accordion */}
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={faq.id}
                value={`item-${index}`}
                className="bg-card rounded-xl border border-border px-4 hover:border-primary/20 transition-colors"
              >
                <AccordionTrigger className="text-left font-medium text-foreground hover:text-primary py-3.5 text-sm gap-3 [&[data-state=open]]:text-primary">
                  <div className="flex items-center gap-2.5">
                    <span className="shrink-0 w-6 h-6 rounded-md bg-secondary flex items-center justify-center text-xs font-semibold text-primary">
                      {index + 1}
                    </span>
                    <span>{faq.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-3.5 text-sm prose prose-sm dark:prose-invert max-w-none pl-8.5">
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
