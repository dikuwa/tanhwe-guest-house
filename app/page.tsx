import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { Phone, MessageCircle, Calendar, LogIn } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-blue-50" />
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <h1 className="text-6xl md:text-7xl font-playfair font-bold mb-6">
            Tanhwe Guest House
          </h1>
          <p className="text-2xl md:text-3xl text-muted-foreground mb-8 font-light">
            Comfort • Hospitality • Convenience
          </p>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            Experience warm Namibian hospitality in the heart of Mukwe. 
            Your perfect getaway awaits.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg">
              <Calendar className="mr-2 h-5 w-5" />
              Check Availability
            </Button>
            <Button size="lg" variant="outline" className="text-lg">
              <MessageCircle className="mr-2 h-5 w-5" />
              WhatsApp Us
            </Button>
            <Button size="lg" variant="outline" className="text-lg">
              <Phone className="mr-2 h-5 w-5" />
              Call Now
            </Button>
          </div>
        </div>
      </section>

      {/* Welcome Section */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-playfair font-bold mb-6">
            Welcome to Tanhwe Guest House
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We offer comfortable accommodation and conference facilities in 
            Mukwe, Namibia. Start your journey by exploring our rooms or 
            checking availability for your stay.
          </p>
          <div className="mt-12">
            <Link href="/admin" className={buttonVariants({ size: "lg" })}>
              <LogIn className="mr-2 h-5 w-5" />
              Admin Login
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
