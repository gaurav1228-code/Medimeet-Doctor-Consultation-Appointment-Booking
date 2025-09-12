"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { creditBenefits, features, testimonials } from "@/lib/data";
import { ArrowRight, Check, Stethoscope } from "lucide-react";
import Link from "next/link";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import Pricing from "./Pricing";


function Home() {
  return (
    <div className="bg-background">
      <section className="relative overflow-hidden py-32">
        <div className="container mx-auto px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12  items-center">
            <div className="space-y-8">
              <Badge
                className="bg-emerald-900/30 border-emerald-700/30 px-4 py-2 text-emerald-400 text-sm font-medium"
                variant="outline"
              >
                Healthcare made simple
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Connect with doctors <br />
                <span className="gradient-title">anytime, anywhere</span>
              </h1>
              <p className="text-muted-foreground text-lg md:text-xl max-w-md">
                Book appointments, consult via video, and manage your healthcare
                journey all in one secure platform.
              </p>
              <div className="flex gap-6">
                <Link href={"https://blessed-doberman-1.accounts.dev/sign-up?sign_up_force_redirect_url=https%3A%2F%2F13ecdb390fb2.ngrok-free.app%2F&redirect_url=https%3A%2F%2F13ecdb390fb2.ngrok-free.app%2F"}>
                  <Button
                    size="lg"
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>

                <Link href={"/Patient-dashboard"}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-emerald-700/30 text-white hover:bg-muted/80"
                  >
                    Find Doctors <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative h-[400px] lg:h-[500px]">
              <img src="/banner2.png" alt="Doctor Consultation" />
            </div>
          </div>
        </div>
      </section>

      <section className="mb-10 py-18 bg-muted/30">
        <div className="container mx-auto px-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:5xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Our platform makes healthcare accessible with just a few clicks
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              return (
                <Card
                  key={index}
                  className="border-emerald-900/40 hover:border-emerald-800/40 hover:shadow-[0px_4px_20px_rgba(16,185,129,0.4)] transition-all duration-300"
                >
                  <CardHeader>
                    <div className="border-emerald-900/40 p-3 rounded-lg w-fit mb-4">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl font-semibold">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="my-12 py-18">
        <div className="container mx-auto px-16">
          <div className="text-center mb-16">
            <Badge
              className="bg-emerald-900/30 border-emerald-700/30 px-4 py-2 mb-3 text-emerald-400 text-sm font-medium"
              variant="outline"
            >
              Affordable Healthcare
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:5xl font-bold text-white mb-4">
              Consultation Packages
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Choose the perfect consultation package that fits your healthcare
              needs
            </p>
          </div>
          <div>
            {/* Pricing table */}
            <Pricing />

            <Card className="mt-12 bg-muted/20 border-emerald-900/40">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-white flex items-center">
                  <Stethoscope className="h-5 w-5 mr-2 text-emerald-400" />
                  How Our Credit System Works
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {creditBenefits.map((benefit, idx) => {
                    return (
                      <li key={idx} className="flex items-center">
                        <Check className="mr-3 mt-1 w-5 h-5 p-0.5 bg-emerald-900/30 rounded-full  text-emerald-400" />

                        <p
                          className="text-muted-foreground"
                          dangerouslySetInnerHTML={{ __html: benefit }}
                        ></p>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="my-12 py-18 bg-muted/30">
        <div className="container mx-auto px-16">
          <div className="text-center mb-16">
            <Badge
              className="mb-4 px-4 py-2 text-sm font-medium  text-emerald-400 bg-emerald-900/30 border-emerald-700/30 "
              variant="outline"
            >
              Success Stories
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:5xl font-bold text-white mb-4">
              What Our User Say
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Hear from patients and doctors who use our platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => {
              return (
                <Card
                  key={index}
                  className="border-emerald-900/40 hover:border-emerald-800/40 hover:shadow-[0px_4px_20px_rgba(16,185,129,0.4)] transition-all duration-300"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 mr-4 flex justify-center items-center bg-emerald-900/20 rounded-full ">
                        <span className="text-emerald-400 font-bold">
                          {testimonial.initials}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">
                          {testimonial.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                    <p className="text-muted-foreground">
                      "{testimonial.quote}"
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mb-10 py-18">
        <div className="container mx-auto px-16">
          <Card className="bg-gradient-to-r from-emerald-900/30 to-emerald-950/20 border-emerald-800/20">
            <CardContent className="p-8 lg:p-16 relative overflow-hidden">
              <div>
                <h2 className="mb-6 text-3xl md:text-4xl font-bold text-white">
                  Ready to take control of your health?
                </h2>
                <p className="mb-8 text-lg text-muted-foreground ">
                  Join thousands of users who have simplified their healthcare
                  journey with our platform. Get started today and experience
                  healthcare the way it should be.
                </p>
              </div>
              <div className="flex flex-col md:flex-row gap-6 ">
                <Button
                  size="lg"
                  className=" text-white bg-emerald-600 hover:bg-emerald-700"
                >
                  <Link href={"/sign-up"}>Sign Up Now</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-emerald-700/30 hover:bg-muted/80"
                >
                  <Link href={"/pricing"}>View Pricing</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

    </div>
  );
}

export default Home;

