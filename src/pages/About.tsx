import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users } from "lucide-react";
import { CrossLogo } from "@/components/CrossLogo";
import TeamModal from "@/components/TeamModal";
import PageTransition from "@/components/PageTransition";

const About = () => {
  const navigate = useNavigate();
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  const handleBack = () => {
    // Check if there's history to go back to, otherwise go to dashboard
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <>
      <PageTransition>
        <div className="min-h-screen gradient-bg p-4">
          <div className="max-w-4xl mx-auto py-8">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <CrossLogo size={100} />
                </div>
                <CardTitle className="text-3xl">About CathoLink</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <section>
                  <h2 className="text-xl font-semibold text-primary mb-3">Faith. Attendance. Connection.</h2>
                  <p className="text-muted-foreground">
                    CathoLink is a comprehensive attendance tracking system designed specifically for 
                    Binmaley Catholic School Inc. It combines faith, technology, and community to ensure 
                    the safety and accountability of our students.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-primary mb-3">Our Mission</h2>
                  <p className="text-muted-foreground">
                    To provide a seamless, secure, and efficient way to track student attendance while 
                    keeping parents informed and connected with their children's school activities.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-primary mb-3">Features</h2>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Real-time QR code-based attendance tracking</li>
                    <li>Automatic parent notifications via SMS and email</li>
                    <li>Comprehensive attendance history and reports</li>
                    <li>Role-based access for students and administrators</li>
                    <li>Birthday celebrations for students</li>
                    <li>Secure and encrypted data handling</li>
                  </ul>
                </section>

                {/* Team Button */}
                <section>
                  <Button
                    onClick={() => setIsTeamModalOpen(true)}
                    variant="outline"
                    className="group w-full h-14 text-sm sm:text-lg gap-2 sm:gap-3 border-2 border-primary/20 hover:border-primary hover:bg-primary/5 hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
                  >
                    <Users className="h-5 w-5 text-primary flex-shrink-0 group-hover:drop-shadow-[0_0_8px_hsl(var(--primary))] group-hover:scale-110 transition-all duration-300" />
                    <span className="truncate group-hover:text-primary group-hover:drop-shadow-[0_0_10px_hsl(var(--primary))] transition-all duration-300">
                      View Creators & Development Team
                    </span>
                  </Button>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-primary mb-3">Contact</h2>
                  <p className="text-muted-foreground">
                    For support or inquiries, please contact the school administration at 
                    Binmaley Catholic School Inc.
                  </p>
                </section>

                <div className="mt-8 text-center text-sm text-muted-foreground">
                  <p>© 2025 CathoLink - All Rights Reserved</p>
                  <p className="mt-2">Powered by Stark Corporation</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageTransition>
      
      <TeamModal isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)} />
    </>
  );
};

export default About;
