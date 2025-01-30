import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Shield, Copy, RefreshCw, AlertCircle } from "lucide-react";
import { anonymizeText, getDetectedTypes } from "@/lib/anonymizer";

const replacements = {
  PER: "Navn",
  LOC: "Sted",
  ORG: "Organisation",
  MISC: "Information",
  CPR: "CPR-nummer",
  PHONE: "Telefonnummer",
  EMAIL: "Email",
  NAME: "Navn",
  ADDRESS: "Adresse"
};

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedTypes, setDetectedTypes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const processText = useCallback(async () => {
    if (!inputText.trim()) {
      toast({
        title: "Ingen tekst at behandle",
        description: "Indtast venligst noget tekst først",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      console.log('Starter tekstbehandling...');

      // Show initial loading toast
      toast({
        title: "Indlæser AI model",
        description: "Dette kan tage et øjeblik...",
      });

      const [detected, anonymized] = await Promise.all([
        getDetectedTypes(inputText),
        anonymizeText(inputText)
      ]);

      // Show success toast
      toast({
        title: "Tekst behandlet",
        description: detected.length > 0 
          ? "Din tekst er blevet anonymiseret"
          : "Ingen personfølsomme data fundet i teksten",
      });

      setDetectedTypes(detected);
      setOutputText(anonymized);
      setError(null);

    } catch (error) {
      console.error('Behandlingsfejl:', error);
      const errorMessage = error instanceof Error ? error.message : 'Der skete en uventet fejl';

      setError(errorMessage);

      // Show error toast
      toast({
        title: "Fejl under behandling af tekst",
        description: "Bruger simpel mønstergenkendelse i stedet for AI model",
        variant: "destructive",
      });

      // Try fallback to basic pattern matching
      try {
        const anonymized = await anonymizeText(inputText);
        setOutputText(anonymized);
      } catch (fallbackError) {
        console.error('Fallback fejl:', fallbackError);
        toast({
          title: "Kritisk fejl",
          description: "Kunne ikke behandle teksten. Prøv igen senere.",
          variant: "destructive",
        });
      }
    } finally {
      setIsProcessing(false);
    }
  }, [inputText, toast]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(outputText);
      toast({
        title: "Kopieret til udklipsholder",
        description: "Den anonymiserede tekst er blevet kopieret",
      });
    } catch (error) {
      toast({
        title: "Kunne ikke kopiere",
        description: "Prøv at kopiere manuelt",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-semibold">Fjern persondata fra tekst</h1>
        </div>

        {/* Info Card */}
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div>
            <h2 className="font-medium">Ingen data forlader din computer</h2>
            <p className="text-sm text-muted-foreground">
              Al tekstbehandling foregår lokalt i din browser. Den anvendte AI-model kører også lokalt,
              så dine data forlader aldrig din enhed.
            </p>
          </div>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="p-4 bg-destructive/5 border-destructive/20">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </Card>
        )}

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Original tekst</h2>
            <Textarea
              placeholder="Indsæt din tekst her..."
              className="min-h-[300px] resize-none"
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                if (error) setError(null);
              }}
              disabled={isProcessing}
            />
            <Button
              onClick={processText}
              className="w-full"
              disabled={!inputText.trim() || isProcessing}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Behandler tekst...
                </>
              ) : (
                "Fjern persondata"
              )}
            </Button>
          </div>

          {/* Output Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Renset tekst</h2>
            <Textarea
              readOnly
              className="min-h-[300px] resize-none bg-muted"
              value={outputText}
              placeholder="Renset tekst vil blive vist her..."
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={copyToClipboard}
              disabled={!outputText}
            >
              <Copy className="mr-2 h-4 w-4" />
              Kopiér til udklipsholder
            </Button>
          </div>
        </div>

        {/* Detection Results */}
        {detectedTypes.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Detekteret og fjernet:</h3>
            <div className="flex flex-wrap gap-2">
              {detectedTypes.map((type) => (
                <Badge key={type} variant="secondary" className="capitalize">
                  {replacements[type as keyof typeof replacements] || type}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}