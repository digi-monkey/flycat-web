import { Button, message } from 'antd';
import { useState, useEffect } from 'react';

const InstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [messageApi, contextHolder] = message.useMessage();

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
      return messageApi.warning(
        'Device Not supported. Please manually Tap the share button in your browser and select "Add to Home Screen" on iOS or "Install" on Android.',
      );
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;

        if (choiceResult.outcome === 'accepted') {
          messageApi.success('PWA installation accepted');
        } else {
          messageApi.error('PWA installation dismissed');
        }
        setDeferredPrompt(null);
      } catch (error: any) {
        messageApi.error(error.message);
      }
    } else {
      return messageApi.error('deferredPrompt is null. Please use Safari/Chrome and try again.');
    }
  };

  return (
    <>
      {contextHolder}
      <Button size="large" type="primary" onClick={handleInstallClick}>
        Install PWA App
      </Button>
    </>
  );
};

export default InstallButton;
