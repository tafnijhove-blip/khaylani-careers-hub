// Centralized status and priority utilities using semantic design tokens

export const getVacatureStatusClass = (status: string): string => {
  const statusMap: Record<string, string> = {
    open: "bg-[hsl(var(--status-open-bg))] text-[hsl(var(--status-open))] border-[hsl(var(--status-open-border))]",
    invulling: "bg-[hsl(var(--status-invulling-bg))] text-[hsl(var(--status-invulling))] border-[hsl(var(--status-invulling-border))]",
    on_hold: "bg-[hsl(var(--status-hold-bg))] text-[hsl(var(--status-hold))] border-[hsl(var(--status-hold-border))]",
    gesloten: "bg-[hsl(var(--status-gesloten-bg))] text-[hsl(var(--status-gesloten))] border-[hsl(var(--status-gesloten-border))]",
  };
  return statusMap[status] || statusMap.gesloten;
};

export const getVacatureStatusLabel = (status: string): string => {
  const labelMap: Record<string, string> = {
    open: "Open",
    invulling: "In Vulling",
    on_hold: "On Hold",
    gesloten: "Gesloten",
  };
  return labelMap[status] || status;
};

export const getPriorityClass = (priority: string): string => {
  const priorityMap: Record<string, string> = {
    urgent: "bg-[hsl(var(--priority-urgent-bg))] text-[hsl(var(--priority-urgent))] border-[hsl(var(--priority-urgent-border))]",
    hoog: "bg-[hsl(var(--priority-hoog-bg))] text-[hsl(var(--priority-hoog))] border-[hsl(var(--priority-hoog-border))]",
    normaal: "bg-[hsl(var(--priority-normaal-bg))] text-[hsl(var(--priority-normaal))] border-[hsl(var(--priority-normaal-border))]",
    laag: "bg-[hsl(var(--priority-laag-bg))] text-[hsl(var(--priority-laag))] border-[hsl(var(--priority-laag-border))]",
  };
  return priorityMap[priority] || priorityMap.normaal;
};

export const getPriorityLabel = (priority: string): string => {
  const labelMap: Record<string, string> = {
    urgent: "Urgent",
    hoog: "Hoog",
    normaal: "Normaal",
    laag: "Laag",
  };
  return labelMap[priority] || priority;
};

export const getKandidaatStatusClass = (status: string): string => {
  const statusMap: Record<string, string> = {
    geplaatst: "bg-[hsl(var(--kandidaat-geplaatst-bg))] text-[hsl(var(--kandidaat-geplaatst))] border-[hsl(var(--kandidaat-geplaatst-border))]",
    gestart: "bg-[hsl(var(--kandidaat-gestart-bg))] text-[hsl(var(--kandidaat-gestart))] border-[hsl(var(--kandidaat-gestart-border))]",
    afgerond: "bg-[hsl(var(--kandidaat-afgerond-bg))] text-[hsl(var(--kandidaat-afgerond))] border-[hsl(var(--kandidaat-afgerond-border))]",
    gestopt: "bg-[hsl(var(--kandidaat-gestopt-bg))] text-[hsl(var(--kandidaat-gestopt))] border-[hsl(var(--kandidaat-gestopt-border))]",
  };
  return statusMap[status] || statusMap.geplaatst;
};

export const getKandidaatStatusLabel = (status: string): string => {
  const labelMap: Record<string, string> = {
    geplaatst: "Geplaatst",
    gestart: "Gestart",
    afgerond: "Afgerond",
    gestopt: "Gestopt",
  };
  return labelMap[status] || status;
};
