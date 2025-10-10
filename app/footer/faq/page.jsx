// app/faq/page.jsx
import { PageHeader } from "@/components/PageHeader";
export default function FAQ() {
  const faqs = [
    {
      question: "How do I book an appointment?",
      answer: "Simply create an account, browse available doctors, select your preferred time slot, and confirm your booking."
    },
    {
      question: "Is my medical information secure?",
      answer: "Yes, we use end-to-end encryption and comply with healthcare privacy regulations to protect your data."
    },
    {
      question: "Can I cancel or reschedule my appointment?",
      answer: "Yes, you can cancel or reschedule up to 24 hours before your appointment without any charges."
    },
    {
      question: "What if I have technical issues during the call?",
      answer: "We have 24/7 technical support. You can contact our support team through the app or website."
    },
    {
      question: "Are the doctors verified?",
      answer: "All doctors on our platform are thoroughly verified and licensed to practice in their respective regions."
    }
  ];

  return (
    <div className="pt-20 min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-6 py-16">
        <PageHeader
        icon={null}
        title={null}
        backLink="/"
        backLabel="Home"
      />
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions about our services
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                {faq.question}
              </h3>
              <p className="text-muted-foreground">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
