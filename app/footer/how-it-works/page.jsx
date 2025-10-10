import { PageHeader } from "@/components/PageHeader";

// app/footer/how-it-works/page.jsx
export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Create an Account",
      description: "Sign up as a patient or doctor and complete your profile setup."
    },
    {
      number: "02",
      description: "Browse through verified healthcare professionals and check their availability."
    },
    {
      number: "03",
      title: "Book Appointment",
      description: "Select your preferred time slot and book your consultation."
    },
    {
      number: "04",
      title: "Video Consultation",
      description: "Connect with your doctor via secure video call at the scheduled time."
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
            How It Works
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Simple steps to connect with healthcare professionals from the comfort of your home
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-lg">{step.number}</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {step.title}
              </h3>
              <p className="text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}