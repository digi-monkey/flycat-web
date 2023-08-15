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

  const handleInstallClick = () => {
    if (!('serviceWorker' in navigator && 'PushManager' in window)) {
      return messageApi.warning('PWA not supported in browser environment.');
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          messageApi.success('PWA installation accepted');
        } else {
          messageApi.error('PWA installation dismissed');
        }
        setDeferredPrompt(null);
      });
    }
  };

  return (
    <>
      {contextHolder}
      <Button size="large" type="primary" onClick={handleInstallClick}>
        Install App
      </Button>
    </>
  );
};

export default InstallButton;
