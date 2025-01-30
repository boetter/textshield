import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Shield, Copy, RefreshCw } from "lucide-react";
import { anonymizeText, getDetectedTypes } from "@/lib/anonymizer";

const replacements = {
  cpr: "CPR-nummer",
  phone: "Telefonnummer",
  address: "Adresse",
  name: "Navn",
  email: "Email",
  creditCard: "Betalingskort",
  bankAccount: "Kontonummer",
  cvr: "CVR-nummer",
  postalCode: "Postnummer og by",
  date: "Dato",
  age: "Alder",
  pin: "PIN-kode",
  money: "Beløb"
};

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedTypes, setDetectedTypes] = useState<string[]>([]);
  const { toast } = useToast();

  const processText = useCallback(() => {
    setIsProcessing(true);
    try {
      // Simulate processing delay for UX
      setTimeout(() => {
        const detected = getDetectedTypes(inputText);
        setDetectedTypes(detected);
        const anonymized = anonymizeText(inputText);
        setOutputText(anonymized);
        setIsProcessing(false);
      }, 500);
    } catch (error) {
      toast({
        title: "Fejl under behandling af tekst",
        description: "Prøv venligst igen med en anden tekst",
        variant: "destructive",
      });
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
              Al tekstbehandling foregår lokalt i din browser. Dine data forlader aldrig din enhed.
            </p>
          </div>
        </Card>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Original tekst</h2>
            <Textarea
              placeholder="Indsæt din tekst her..."
              className="min-h-[300px] resize-none"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <Button
              onClick={processText}
              className="w-full"
              disabled={!inputText || isProcessing}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Behandler...
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
                  {replacements[type as keyof typeof replacements]}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}