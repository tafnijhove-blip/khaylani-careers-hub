import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Briefcase, MapPin, Calendar, AlertCircle, CheckCircle2, Users } from "lucide-react";
import { getVacatureStatusClass, getPriorityClass } from "@/lib/statusUtils";

interface Vacature {
  id: string;
  functietitel: string;
  status: string;
  prioriteit: string;
  aantal_posities: number;
  bedrijf_id: string;
  vereisten: string[] | null;
  beloning: string | null;
  opmerkingen: string | null;
  datum_toegevoegd: string;
}

interface Bedrijf {
  id: string;
  naam: string;
  regio: string;
  plaats: string | null;
}

interface VacatureStat {
  posities_vervuld: number;
  posities_open: number;
}

interface VacatureDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vacature: Vacature | null;
  bedrijf: Bedrijf | null;
  stats: VacatureStat | null;
}

export function VacatureDetailDialog({ 
  open, 
  onOpenChange, 
  vacature, 
  bedrijf,
  stats 
}: VacatureDetailDialogProps) {
  if (!vacature || !bedrijf) return null;

  const vervuld = stats?.posities_vervuld || 0;
  const openPosities = stats?.posities_open || vacature.aantal_posities;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gradient flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            {vacature.functietitel}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4" />
            {bedrijf.naam} • {bedrijf.regio}
            {bedrijf.plaats && ` • ${bedrijf.plaats}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Status & Priority */}
          <div className="flex flex-wrap gap-3">
            <Badge className={getVacatureStatusClass(vacature.status)} variant="outline">
              {vacature.status === 'open' && <AlertCircle className="h-3 w-3 mr-1" />}
              {vacature.status === 'gesloten' && <CheckCircle2 className="h-3 w-3 mr-1" />}
              Status: {vacature.status}
            </Badge>
            <Badge className={getPriorityClass(vacature.prioriteit)} variant="outline">
              Prioriteit: {vacature.prioriteit}
            </Badge>
            <Badge variant="secondary">
              <Calendar className="h-3 w-3 mr-1" />
              {new Date(vacature.datum_toegevoegd).toLocaleDateString('nl-NL')}
            </Badge>
          </div>

          {/* Posities info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Totaal Posities</span>
              </div>
              <div className="text-2xl font-bold text-primary">{vacature.aantal_posities}</div>
            </div>
            <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-muted-foreground">Vervuld</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{vervuld}</div>
            </div>
            <div className="p-4 rounded-lg bg-orange-500/5 border border-orange-500/20">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-muted-foreground">Open</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">{openPosities}</div>
            </div>
          </div>

          {/* Functie-eisen */}
          {vacature.vereisten && vacature.vereisten.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Functie-eisen
              </h3>
              <ul className="space-y-2">
                {vacature.vereisten.map((eis, index) => (
                  <li key={index} className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm">{eis}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Beloning */}
          {vacature.beloning && (
            <div className="p-4 rounded-lg bg-gradient-primary/5 border border-primary/20">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Beloning</h3>
              <p className="text-lg font-medium">{vacature.beloning}</p>
            </div>
          )}

          {/* Opmerkingen */}
          {vacature.opmerkingen && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Opmerkingen</h3>
              <p className="text-sm text-foreground p-4 rounded-lg bg-muted/30 whitespace-pre-wrap">
                {vacature.opmerkingen}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
