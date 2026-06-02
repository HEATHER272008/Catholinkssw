import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import teamMinion from '@/assets/team-minion.png';

interface TeamMember {
  name: string;
  role: string;
  photo?: string;
  quote: string;
  facebook: string;
}

const teamMembers: TeamMember[] = [
  {
    name: 'Mark Emman Lopez',
    role: 'Developer',
    photo: '',
    quote: '"Code is poetry, and every bug is a plot twist."',
    facebook: 'https://www.facebook.com/',
  },
  {
    name: 'Jermaine Summer Segundo',
    role: 'Research Leader',
    photo: '',
    quote: '"Leading with purpose, researching with passion."',
    facebook: 'https://www.facebook.com/',
  },
  {
    name: 'Edrian Rheine Baugan',
    role: 'Research Member',
    photo: '',
    quote: '"Innovation starts with asking the right questions."',
    facebook: 'https://www.facebook.com/',
  },
  {
    name: 'Samuel Jr. De Guzman',
    role: 'Research Member',
    photo: '',
    quote: '"Together we achieve what seems impossible."',
    facebook: 'https://www.facebook.com/',
  },
  {
    name: 'Jake Raizain Bambao',
    role: 'Research Member',
    photo: '',
    quote: '"Every challenge is an opportunity in disguise."',
    facebook: 'https://www.facebook.com/',
  },
];

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TeamModal = ({ isOpen, onClose }: TeamModalProps) => {
  const [hoveredMember, setHoveredMember] = useState<string | null>(null);

  const handleCardClick = (facebook: string) => {
    window.open(facebook, '_blank', 'noopener,noreferrer');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] max-w-[650px] max-h-[90vh] p-0 gap-0 overflow-hidden rounded-3xl border-0 shadow-2xl [&>button]:hidden flex flex-col bg-background">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
              <img src={teamMinion} alt="Team" className="w-12 h-12 object-contain" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white">
                Development Team
              </DialogTitle>
              <p className="text-white/80 text-sm">
                The people behind CathoLink
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Team Members Grid */}
        <div className="flex-1 overflow-y-auto p-5 bg-background">
          <p className="text-xs text-muted-foreground text-center mb-5">
            Tap a card to view developer profile
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {teamMembers.map((member, index) => (
              <div
                key={member.name}
                className="relative group cursor-pointer animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
                onMouseEnter={() => setHoveredMember(member.name)}
                onMouseLeave={() => setHoveredMember(null)}
                onTouchStart={() => setHoveredMember(member.name)}
                onTouchEnd={() => setTimeout(() => setHoveredMember(null), 2000)}
                onClick={() => handleCardClick(member.facebook)}
              >
                <div className="bg-card border border-border rounded-2xl p-4 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center h-full">
                  {/* Circular Avatar */}
                  <div className="w-20 h-20 rounded-full bg-muted border-2 border-primary/20 flex items-center justify-center overflow-hidden mb-3 group-hover:border-primary/50 group-hover:scale-105 transition-all duration-300">
                    {member.photo ? (
                      <img
                        src={member.photo}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-primary font-bold text-xl">
                        {getInitials(member.name)}
                      </span>
                    )}
                  </div>
                  
                  {/* Name */}
                  <p className="font-semibold text-foreground text-sm leading-tight mb-1">
                    {member.name}
                  </p>
                  
                  {/* Role */}
                  <p className="text-xs text-primary font-medium">
                    {member.role}
                  </p>
                  
                  {/* External link indicator on hover */}
                  <ExternalLink className="h-3 w-3 text-muted-foreground mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                
                {/* Quote overlay on hover */}
                <div 
                  className={`absolute inset-0 bg-primary/95 rounded-2xl p-3 flex flex-col items-center justify-center text-center transition-all duration-300 ${
                    hoveredMember === member.name 
                      ? 'opacity-100 scale-100' 
                      : 'opacity-0 scale-95 pointer-events-none'
                  }`}
                >
                  <p className="text-primary-foreground text-xs italic leading-relaxed">
                    {member.quote}
                  </p>
                  <p className="text-primary-foreground/70 text-[10px] mt-2 font-medium">
                    — {member.name.split(' ')[0]} {member.name.split(' ').slice(-1)[0]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 bg-background border-t border-border">
          <Button onClick={onClose} variant="outline" className="w-full rounded-xl">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeamModal;