import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "What is your return policy?",
    answer:
      "We offer a 7-day return policy for all products in their original condition. Electronics must be unopened or defective for full refund. Contact our support team to initiate a return.",
  },
  {
    question: "Do you offer installation services?",
    answer:
      "Yes! We provide free installation for select appliances including ACs, washing machines, and large TVs. Our trained technicians will set up your product at your convenience.",
  },
  {
    question: "What warranty do you provide?",
    answer:
      "All products come with manufacturer warranty (typically 1-2 years). We also offer extended warranty plans for additional coverage up to 5 years at competitive prices.",
  },
  {
    question: "How long does delivery take?",
    answer:
      "Standard delivery takes 3-5 business days nationwide. Express delivery (1-2 days) is available for major cities. Large appliances may require scheduled delivery.",
  },
  {
    question: "Do you price match competitors?",
    answer:
      "Absolutely! If you find a lower price at an authorized retailer, we'll match it. Just show us the competitor's price and we'll adjust your order accordingly.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit/debit cards, bank transfers, JazzCash, Easypaisa, and Cash on Delivery (COD). EMI options are available on select products.",
  },
];

const FAQ = () => {
  return (
    <section className="py-10 bg-secondary/30" id="faq">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <HelpCircle className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl md:text-2xl font-heading font-bold text-foreground mb-2">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-muted-foreground">
              Find answers to common questions
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card rounded-lg border border-border px-4"
              >
                <AccordionTrigger className="text-left font-medium text-foreground hover:text-primary py-4 text-sm">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4 text-sm">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
