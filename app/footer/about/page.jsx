// app/about/page.jsx
import { PageHeader } from "@/components/PageHeader";
export default function About() {
  return (
    <div className="pt-20 min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-6 py-16">
        <PageHeader
        icon={null}
        title={null}
        backLink="/"
        backLabel="Home"
      />
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              About Medimeet
            </h1>
            <p className="text-xl text-muted-foreground">
              Revolutionizing healthcare accessibility through technology
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Our Mission</h2>
                <p className="text-muted-foreground mb-6">
                  To make quality healthcare accessible to everyone, everywhere by connecting 
                  patients with verified healthcare professionals through seamless digital platforms.
                </p>
                
                <h2 className="text-2xl font-bold text-foreground mb-4">Our Vision</h2>
                <p className="text-muted-foreground">
                  We envision a world where geographical barriers no longer prevent people 
                  from receiving the medical care they need, when they need it.
                </p>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">What We Do</h2>
                <p className="text-muted-foreground mb-6">
                  Medimeet provides a secure platform for virtual healthcare consultations, 
                  appointment scheduling, and medical record management. We bridge the gap 
                  between patients and healthcare providers.
                </p>
                
                <h2 className="text-2xl font-bold text-foreground mb-4">Our Values</h2>
                <ul className="text-muted-foreground space-y-2">
                  <li>• Patient-centric care</li>
                  <li>• Medical excellence</li>
                  <li>• Data privacy and security</li>
                  <li>• Innovation and reliability</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}