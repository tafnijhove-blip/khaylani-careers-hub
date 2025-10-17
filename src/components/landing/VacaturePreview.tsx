import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Euro, Users, ArrowRight, Clock } from "lucide-react";

const VacaturePreview = () => {
  const vacatures = [
    {
      title: "Software Engineer",
      company: "TechCorp Amsterdam",
      location: "Amsterdam",
      salary: "€5.500 - €7.000",
      positions: 3,
      status: "open",
      priority: "urgent",
      requirements: ["React", "TypeScript", "Node.js"],
      posted: "2 dagen geleden"
    },
    {
      title: "Accountmanager",
      company: "Sales Solutions Rotterdam",
      location: "Rotterdam",
      salary: "€4.000 - €5.500",
      positions: 2,
      status: "invulling",
      priority: "hoog",
      requirements: ["B2B Sales", "CRM", "Relatiemanagement"],
      posted: "5 dagen geleden"
    },
    {
      title: "Projectleider",
      company: "BuildCo Utrecht",
      location: "Utrecht",
      salary: "€5.000 - €6.500",
      positions: 1,
      status: "open",
      priority: "hoog",
      requirements: ["Agile", "Scrum", "Teamleiding"],
      posted: "3 dagen geleden"
    },
    {
      title: "Administratief Medewerker",
      company: "Office Solutions Den Haag",
      location: "Den Haag",
      salary: "€2.500 - €3.500",
      positions: 2,
      status: "open",
      priority: "normaal",
      requirements: ["MS Office", "Administratie", "Klantencontact"],
      posted: "1 week geleden"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'invulling': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'hold': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'hoog': return 'bg-orange-500 text-white';
      case 'normaal': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="space-y-4">
      {vacatures.map((vacature, index) => (
        <Card 
          key={index} 
          className="p-6 glass-card hover-lift group animate-fade-in"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1 space-y-3">
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold truncate">{vacature.title}</h3>
                    <Badge className={getPriorityColor(vacature.priority)}>
                      {vacature.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      <span>{vacature.company}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{vacature.location}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Euro className="h-4 w-4 text-primary" />
                  <span className="font-medium">{vacature.salary}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span>{vacature.positions} {vacature.positions === 1 ? 'positie' : 'posities'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{vacature.posted}</span>
                </div>
              </div>

              {/* Requirements */}
              <div className="flex flex-wrap gap-2">
                {vacature.requirements.map((req, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {req}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 md:items-end">
              <Badge variant="outline" className={getStatusColor(vacature.status)}>
                {vacature.status}
              </Badge>
              <Button size="sm" className="gap-2 group-hover:shadow-glow">
                Details
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default VacaturePreview;
