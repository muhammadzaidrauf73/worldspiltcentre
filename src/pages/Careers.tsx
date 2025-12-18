import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Briefcase, Users, Heart, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const Careers = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="bg-gradient-to-r from-primary to-primary/80 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Careers
          </h1>
          <p className="text-primary-foreground/80">
            Join our team and grow with us
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Why Join Us */}
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold mb-4">Why Work With Us?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We're always looking for talented individuals who are passionate about electronics 
                and customer service to join our growing team.
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-6 mb-12">
              <div className="bg-card border rounded-lg p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Growth</h3>
                <p className="text-sm text-muted-foreground">
                  Career advancement opportunities
                </p>
              </div>
              <div className="bg-card border rounded-lg p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Team</h3>
                <p className="text-sm text-muted-foreground">
                  Supportive work environment
                </p>
              </div>
              <div className="bg-card border rounded-lg p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Benefits</h3>
                <p className="text-sm text-muted-foreground">
                  Competitive salary & perks
                </p>
              </div>
              <div className="bg-card border rounded-lg p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Experience</h3>
                <p className="text-sm text-muted-foreground">
                  Learn from industry experts
                </p>
              </div>
            </div>

            {/* Current Openings */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6">Current Openings</h2>
              <div className="bg-secondary/30 rounded-lg p-8 text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-bold mb-2">No Current Openings</h3>
                <p className="text-muted-foreground mb-4">
                  We don't have any open positions at the moment, but we're always interested 
                  in hearing from talented individuals.
                </p>
                <p className="text-sm text-muted-foreground">
                  Send your resume to our email and we'll keep it on file for future opportunities.
                </p>
              </div>
            </div>

            {/* Contact for Careers */}
            <div className="bg-card border rounded-lg p-6 text-center">
              <h3 className="font-bold mb-2">Interested in Joining Us?</h3>
              <p className="text-muted-foreground mb-4">
                Send your resume and cover letter to our email
              </p>
              <Button asChild>
                <a href="mailto:careers@worldspiltcentre.com">
                  Send Your Resume
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Careers;