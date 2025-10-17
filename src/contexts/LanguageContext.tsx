import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'nl' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  nl: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.vacancies': 'Vacatures',
    'nav.analytics': 'Analytics',
    'nav.companies': 'Bedrijven',
    'nav.users': 'Gebruikers',
    'nav.settings': 'Instellingen',
    'nav.logout': 'Uitloggen',
    
    // Landing Page
    'landing.hero.title': 'Vacaturebeheer voor detacheringsbureaus',
    'landing.hero.subtitle': 'Beheer vacatures en klanten op één centrale plek met real-time inzicht',
    'landing.hero.cta': 'Gratis proberen',
    'landing.hero.demo': 'Bekijk demo',
    'landing.hero.trust': 'Trusted by 50+ recruitment bureaus',
    'landing.hero.main.title': 'Recruiters en sales,',
    'landing.hero.main.highlight': 'eindelijk gesynchroniseerd',
    'landing.hero.main.description': 'Stop met mailen en bellen. Geef je recruiters en accountmanagers direct inzicht in elkaars werk. Managers zien real-time waar de omzet zit. Sneller schakelen = sneller plaatsen.',
    'landing.usp.realtime': 'Real-time synchronisatie',
    'landing.usp.realtime.desc': 'Alle wijzigingen direct zichtbaar voor je team',
    'landing.usp.geographic': 'Geografisch inzicht',
    'landing.usp.geographic.desc': 'Visueel overzicht van vacatures per regio',
    'landing.usp.efficient': 'Minder meetings, meer doen',
    'landing.usp.efficient.desc': 'Iedereen werkt uit dezelfde data',
    'landing.map.badge': 'Live Tracking',
    'landing.map.title': 'Waar zitten je kansen?',
    'landing.map.highlight': 'Zie het in 3 seconden',
    'landing.map.description': 'Stuur je recruiters naar de hotspots. Sales ziet direct waar ze moeten bellen. Managers zien de spread.',
    'landing.vacature.badge': 'Vacature Synchroniseren',
    'landing.vacature.title': 'Iedereen weet',
    'landing.vacature.highlight': 'exact wat er speelt',
    'landing.vacature.description': 'Accountmanager belt klant? Recruiter ziet het. Kandidaat op gesprek? Sales weet het. Geen verrassingen meer.',
    'landing.dashboard.badge': 'Manager Dashboard',
    'landing.dashboard.title': 'Eindelijk weten',
    'landing.dashboard.highlight': 'wat er echt gebeurt',
    'landing.dashboard.description': 'Zie in één blik welke recruiters draaien, waar je omzet zit en waar je moet bijsturen.',
    'landing.nav.login': 'Inloggen',
    'landing.nav.quote': 'Gratis offerte',
    'landing.features.title': 'Alles wat je nodig hebt',
    'landing.features.subtitle': 'Een compleet platform voor vacaturebeheer en klantrelaties',
    'landing.features.map': 'Interactieve Kaart',
    'landing.features.map.desc': 'Visualiseer alle vacatures op een kaart van Nederland',
    'landing.features.dashboard': 'Real-time Dashboard',
    'landing.features.dashboard.desc': 'Live statistieken en KPIs voor je team',
    'landing.features.tracking': 'Team Activiteiten',
    'landing.features.tracking.desc': 'Volg de activiteiten van je team per regio',
    'landing.features.analytics': 'Geavanceerde Analytics',
    'landing.features.analytics.desc': 'Inzicht in trends en performance',
    'landing.cta.title': 'Klaar om te starten?',
    'landing.cta.subtitle': 'Begin vandaag nog met efficiënter vacaturebeheer',
    'landing.cta.button': 'Gratis proberen',
    'landing.footer.tagline': 'Professionele vacaturekaart voor detacheringsbureaus',
    'landing.footer.product': 'Product',
    'landing.footer.features': 'Functies',
    'landing.footer.pricing': 'Prijzen',
    'landing.footer.company': 'Bedrijf',
    'landing.footer.about': 'Over ons',
    'landing.footer.contact': 'Contact',
    'landing.footer.rights': 'Alle rechten voorbehouden',
    
    // Auth Page
    'auth.welcome': 'Welkom terug',
    'auth.subtitle': 'Log in op je account',
    'auth.terms': 'Door in te loggen ga je akkoord met onze voorwaarden',
    'auth.branding.tagline': 'Professionele vacaturekaart voor detacheringsbureaus',
    'auth.feature.companies': 'Bedrijven Beheren',
    'auth.feature.companies.desc': 'Centraal overzicht van alle klanten',
    'auth.feature.vacancies': 'Vacatures Tracken',
    'auth.feature.vacancies.desc': 'Real-time status per regio',
    'auth.feature.analytics': 'Analytics Dashboard',
    'auth.feature.analytics.desc': 'Inzicht in trends en KPI\'s',
    'auth.feature.map': 'Interactieve Kaart',
    'auth.feature.map.desc': 'Visueel overzicht Nederland',
    
    // Common
    'common.loading': 'Laden...',
    'common.save': 'Opslaan',
    'common.cancel': 'Annuleren',
    'common.delete': 'Verwijderen',
    'common.edit': 'Bewerken',
    'common.add': 'Toevoegen',
    'common.search': 'Zoeken...',
    'common.filter': 'Filteren',
    'common.export': 'Exporteren',
    'common.import': 'Importeren',
    'common.status': 'Status',
    'common.actions': 'Acties',
    'common.details': 'Details',
    'common.close': 'Sluiten',
  },
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.vacancies': 'Vacancies',
    'nav.candidates': 'Candidates',
    'nav.analytics': 'Analytics',
    'nav.companies': 'Companies',
    'nav.users': 'Users',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',
    
    // Landing Page
    'landing.hero.title': 'Vacancy Management for Staffing Agencies',
    'landing.hero.subtitle': 'Manage vacancies, candidates and clients in one central place with real-time insights',
    'landing.hero.cta': 'Try for Free',
    'landing.hero.demo': 'View Demo',
    'landing.hero.trust': 'Trusted by 50+ recruitment agencies',
    'landing.hero.main.title': 'Recruiters and sales,',
    'landing.hero.main.highlight': 'finally synchronized',
    'landing.hero.main.description': 'Stop emailing and calling. Give your recruiters and account managers direct insight into each other\'s work. Managers see real-time where the revenue is. Faster switching = faster placements.',
    'landing.usp.realtime': 'Real-time Synchronization',
    'landing.usp.realtime.desc': 'All changes instantly visible to your team',
    'landing.usp.geographic': 'Geographic Insights',
    'landing.usp.geographic.desc': 'Visual overview of vacancies per region',
    'landing.usp.efficient': 'Less Meetings, More Doing',
    'landing.usp.efficient.desc': 'Everyone works from the same data',
    'landing.map.badge': 'Live Tracking',
    'landing.map.title': 'Where are your opportunities?',
    'landing.map.highlight': 'See it in 3 seconds',
    'landing.map.description': 'Send your recruiters to the hotspots. Sales sees directly where to call. Managers see the spread.',
    'landing.vacature.badge': 'Vacancy Sync',
    'landing.vacature.title': 'Everyone knows',
    'landing.vacature.highlight': 'exactly what\'s happening',
    'landing.vacature.description': 'Account manager calls client? Recruiter sees it. Candidate at interview? Sales knows it. No more surprises.',
    'landing.dashboard.badge': 'Manager Dashboard',
    'landing.dashboard.title': 'Finally know',
    'landing.dashboard.highlight': 'what\'s really happening',
    'landing.dashboard.description': 'See at a glance which recruiters are performing, where your revenue is and where you need to adjust.',
    'landing.nav.login': 'Login',
    'landing.nav.quote': 'Free Quote',
    'landing.features.title': 'Everything You Need',
    'landing.features.subtitle': 'A complete platform for vacancy and candidate management',
    'landing.features.map': 'Interactive Map',
    'landing.features.map.desc': 'Visualize all vacancies on a map of the Netherlands',
    'landing.features.dashboard': 'Real-time Dashboard',
    'landing.features.dashboard.desc': 'Live statistics and KPIs for your team',
    'landing.features.tracking': 'Candidate Tracking',
    'landing.features.tracking.desc': 'Track the status of every candidate',
    'landing.features.analytics': 'Advanced Analytics',
    'landing.features.analytics.desc': 'Insights into trends and performance',
    'landing.cta.title': 'Ready to Get Started?',
    'landing.cta.subtitle': 'Start with more efficient vacancy management today',
    'landing.cta.button': 'Try for Free',
    'landing.footer.tagline': 'Professional vacancy map for staffing agencies',
    'landing.footer.product': 'Product',
    'landing.footer.features': 'Features',
    'landing.footer.pricing': 'Pricing',
    'landing.footer.company': 'Company',
    'landing.footer.about': 'About Us',
    'landing.footer.contact': 'Contact',
    'landing.footer.rights': 'All rights reserved',
    
    // Auth Page
    'auth.welcome': 'Welcome Back',
    'auth.subtitle': 'Log in to your account',
    'auth.terms': 'By logging in you agree to our terms',
    'auth.branding.tagline': 'Professional vacancy map for staffing agencies',
    'auth.feature.companies': 'Manage Companies',
    'auth.feature.companies.desc': 'Central overview of all clients',
    'auth.feature.vacancies': 'Track Vacancies',
    'auth.feature.vacancies.desc': 'Real-time status per region',
    'auth.feature.analytics': 'Analytics Dashboard',
    'auth.feature.analytics.desc': 'Insights into trends and KPIs',
    'auth.feature.map': 'Interactive Map',
    'auth.feature.map.desc': 'Visual overview Netherlands',
    
    // Common
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.search': 'Search...',
    'common.filter': 'Filter',
    'common.export': 'Export',
    'common.import': 'Import',
    'common.status': 'Status',
    'common.actions': 'Actions',
    'common.details': 'Details',
    'common.close': 'Close',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'nl';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['nl']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
