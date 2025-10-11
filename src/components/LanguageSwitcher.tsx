import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={() => setLanguage(language === 'nl' ? 'en' : 'nl')}
      className="gap-2 font-medium"
    >
      <Globe className="h-4 w-4" />
      {language === 'nl' ? '🇬🇧 English' : '🇳🇱 Nederlands'}
    </Button>
  );
};

export default LanguageSwitcher;
