import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  Upload, 
  Share2, 
  Copy,
  Check,
  FileJson,
  AlertTriangle
} from 'lucide-react';
import { dataTransferService } from '@/services/dataTransfer';
import { storageService } from '@/services/storage';
import { toast } from 'sonner';

export function DataTransfer() {
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [importData, setImportData] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    dataTransferService.downloadExport();
  };

  const handleGenerateShareLink = () => {
    const link = dataTransferService.generateShareLink();
    setShareLink(link);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast.success('Link kopiran u clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const success = await dataTransferService.importFromFile(file);
    setIsImporting(false);
    
    if (success) {
      window.location.reload();
    }
  };

  const handleTextImport = () => {
    if (!importData.trim()) {
      toast.error('Unesi podatke za uvoz');
      return;
    }

    setIsImporting(true);
    const success = dataTransferService.importData(importData);
    setIsImporting(false);

    if (success) {
      setImportData('');
      window.location.reload();
    }
  };

  const stats = {
    artists: storageService.getTrackedArtists().length,
    songs: storageService.getAddedSongs().length,
    playlists: storageService.getAutoPlaylistId() ? 1 : 0,
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <FileJson className="w-5 h-5 text-green-400" />
          Upravljanje podacima
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="export">
          <TabsList className="bg-zinc-800 mb-4">
            <TabsTrigger value="export" className="data-[state=active]:bg-green-500 data-[state=active]:text-black">
              <Download className="w-4 h-4 mr-2" />
              Izvoz
            </TabsTrigger>
            <TabsTrigger value="import" className="data-[state=active]:bg-green-500 data-[state=active]:text-black">
              <Upload className="w-4 h-4 mr-2" />
              Uvoz
            </TabsTrigger>
            <TabsTrigger value="share" className="data-[state=active]:bg-green-500 data-[state=active]:text-black">
              <Share2 className="w-4 h-4 mr-2" />
              Deljenje
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-zinc-800 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-white">{stats.artists}</p>
                <p className="text-sm text-zinc-400">Izvođača</p>
              </div>
              <div className="bg-zinc-800 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-white">{stats.songs}</p>
                <p className="text-sm text-zinc-400">Pesama</p>
              </div>
              <div className="bg-zinc-800 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-white">{stats.playlists}</p>
                <p className="text-sm text-zinc-400">Plejlista</p>
              </div>
            </div>

            <Button
              onClick={handleExport}
              className="w-full bg-green-500 hover:bg-green-400 text-black"
            >
              <Download className="w-4 h-4 mr-2" />
              Preuzmi backup (.json)
            </Button>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-400">Iz fajla</Label>
              <Input
                type="file"
                accept=".json"
                ref={fileInputRef}
                onChange={handleFileImport}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-zinc-900 px-2 text-zinc-500">ili</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-400">Nalepi JSON podatke</Label>
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="Nalepi ovde JSON podatke..."
                className="w-full h-32 bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <Button
                onClick={handleTextImport}
                disabled={isImporting || !importData.trim()}
                className="w-full bg-green-500 hover:bg-green-400 text-black"
              >
                {isImporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2" />
                    Uvozim...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Uvezi podatke
                  </>
                )}
              </Button>
            </div>

            <div className="flex items-start gap-2 p-3 bg-yellow-500/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-400">
                Uvoz će spojiti podatke sa postojećim. Postojeći podaci neće biti obrisani.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="share" className="space-y-4">
            <Button
              onClick={handleGenerateShareLink}
              className="w-full bg-green-500 hover:bg-green-400 text-black"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Generiši link za deljenje
            </Button>

            {shareLink && (
              <div className="space-y-2">
                <Label className="text-zinc-400">Link za deljenje</Label>
                <div className="flex gap-2">
                  <Input
                    value={shareLink}
                    readOnly
                    className="bg-zinc-800 border-zinc-700 text-white text-sm"
                  />
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    className="border-zinc-700"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-zinc-500">
                  Ovaj link sadrži sve tvoje podatke. Deli ga pažljivo!
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
