import { Button } from 'components/shared/ui/Button';
import { useToast } from 'components/shared/ui/Toast/use-toast';
import { useState, useEffect } from 'react';

const InstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const { toast } = useToast();
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    if ('serviceWorker' in navigator && 'PushManager' in window) {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (!('serviceWorker' in navigator && 'PushManager' in window)) {
      return toast({
        title:
          'Device Not supported. Please manually Tap the share button in your browser and select "Add to Home Screen" on iOS or "Install" on Android.',
        status: 'error',
      });
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;

        if (choiceResult.outcome === 'accepted') {
          toast({ title: 'PWA installation accepted', status: 'success' });
        } else {
          toast({ title: 'PWA installation dismissed', status: 'error' });
        }
        setDeferredPrompt(null);
      } catch (error: any) {
        toast({ title: error.message, status: 'error' });
      }
    } else {
      return toast({
        title:
          'deferredPrompt is null. Please use Safari/Chrome and try again.',
        status: 'error',
      });
    }
  };

  return (
    <>
      <Button size="lg" onClick={handleInstallClick}>
        Install PWA App
      </Button>
    </>
  );
};

export default InstallButton;
