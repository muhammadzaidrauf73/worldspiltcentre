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
import { HelpCircle, MessageCircleQuestion, Sparkles, Lightbulb, BookOpen } from "lucide-react";
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
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-teal-500/5 to-emerald-500/5" />
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
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/8 via-teal-500/6 to-emerald-500/8 dark:from-cyan-500/15 dark:via-teal-500/10 dark:to-emerald-500/15" />
      
      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 left-1/3 w-[500px] h-[500px] bg-gradient-to-br from-cyan-300/20 to-teal-300/20 dark:from-cyan-500/10 dark:to-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s' }} />
        <div className="absolute -bottom-32 right-1/3 w-[400px] h-[400px] bg-gradient-to-br from-teal-300/20 to-emerald-300/20 dark:from-teal-500/10 dark:to-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1.5s' }} />
      </div>

      {/* Floating decorations */}
      <div className="absolute top-20 left-[10%] opacity-30 dark:opacity-20">
        <Lightbulb className="h-7 w-7 text-cyan-500 animate-pulse" style={{ animationDuration: '2s' }} />
      </div>
      <div className="absolute bottom-24 right-[12%] opacity-30 dark:opacity-20">
        <MessageCircleQuestion className="h-8 w-8 text-teal-500 animate-bounce" style={{ animationDuration: '3s' }} />
      </div>
      <div className="absolute top-1/3 right-[8%] opacity-25 dark:opacity-15">
        <BookOpen className="h-6 w-6 text-emerald-400 animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto">
          {/* Unified Header */}
          <div className="flex flex-col items-center text-center mb-8 sm:mb-10">
            <div className="flex items-center gap-4 sm:gap-5 mb-4">
              {/* Premium animated icon */}
              <div className="relative group">
                <div className="absolute -inset-3 bg-gradient-to-r from-cyan-400 via-teal-500 to-emerald-500 rounded-2xl opacity-30 blur-lg group-hover:opacity-50 transition-opacity duration-500" />
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-teal-500 to-emerald-500 rounded-2xl opacity-75 animate-spin" style={{ animationDuration: '8s' }} />
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-cyan-400 via-teal-500 to-emerald-500 flex items-center justify-center shadow-2xl shadow-teal-500/40">
                  <HelpCircle className="h-7 w-7 sm:h-8 sm:w-8 text-white drop-shadow-lg" />
                </div>
                <Sparkles className="absolute -top-2 -right-2 h-5 w-5 text-yellow-400 drop-shadow-lg animate-pulse" style={{ animationDuration: '1.5s' }} />
                <Lightbulb className="absolute -bottom-1 -left-1 h-4 w-4 text-cyan-200 animate-pulse" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap justify-center mb-2">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold bg-gradient-to-r from-cyan-600 via-teal-500 to-emerald-600 dark:from-cyan-400 dark:via-teal-400 dark:to-emerald-400 bg-clip-text text-transparent">
                Frequently Asked Questions
              </h2>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500/20 to-teal-500/20 dark:from-cyan-500/30 dark:to-teal-500/30 text-cyan-700 dark:text-cyan-300 text-[10px] sm:text-xs font-bold border border-cyan-300/50 dark:border-cyan-500/30 backdrop-blur-sm">
                <MessageCircleQuestion className="h-3 w-3" />
                HELP
              </span>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 animate-pulse shadow-lg shadow-cyan-500/50" />
              Find answers to common questions
            </p>
          </div>

          {/* FAQ Accordion */}
          <Accordion type="single" collapsible className="space-y-3 sm:space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={faq.id}
                value={`item-${index}`}
                className="group bg-white/70 dark:bg-white/5 backdrop-blur-sm rounded-2xl border border-cyan-200/50 dark:border-cyan-500/20 px-5 sm:px-6 shadow-lg hover:shadow-xl hover:border-teal-400/50 dark:hover:border-teal-500/30 transition-all duration-300 animate-fade-in overflow-hidden"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <AccordionTrigger className="text-left font-semibold text-foreground hover:text-teal-600 dark:hover:text-teal-400 py-4 sm:py-5 text-sm sm:text-base gap-4 [&[data-state=open]]:text-teal-600 dark:[&[data-state=open]]:text-teal-400">
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-100 to-teal-100 dark:from-cyan-900/30 dark:to-teal-900/30 flex items-center justify-center group-hover:from-cyan-200 group-hover:to-teal-200 dark:group-hover:from-cyan-800/40 dark:group-hover:to-teal-800/40 transition-colors">
                      <span className="text-sm font-bold bg-gradient-to-r from-cyan-600 to-teal-600 dark:from-cyan-400 dark:to-teal-400 bg-clip-text text-transparent">
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
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-teal-200/50 dark:border-teal-500/20 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center">
                <MessageCircleQuestion className="h-5 w-5 text-white" />
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
