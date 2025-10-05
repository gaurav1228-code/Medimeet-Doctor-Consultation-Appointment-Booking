// app/services/page.jsx
export default function Services() {
  const services = [
    {
      title: "Video Consultations",
      description: "Secure, high-quality video calls with healthcare professionals",
      icon: "🎥"
    },
    {
      title: "Appointment Booking",
      description: "Easy scheduling and management of medical appointments",
      icon: "📅"
    },
    {
      title: "Medical Records",
      description: "Secure storage and access to your medical history",
      icon: "📋"
    },
    {
      title: "Prescription Management",
      description: "Digital prescriptions and medication tracking",
      icon: "💊"
    },
    {
      title: "Health Monitoring",
      description: "Track and monitor your health metrics over time",
      icon: "📊"
    },
    {
      title: "24/7 Support",
      description: "Round-the-clock customer and technical support",
      icon: "🛟"
    }
  ];

  return (
    <div className="pt-20 min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Our Services
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Comprehensive healthcare solutions designed for your convenience and well-being
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {services.map((service, index) => (
            <div key={index} className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl mb-4">{service.icon}</div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {service.title}
              </h3>
              <p className="text-muted-foreground">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}