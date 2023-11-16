import { useEffect, useState } from 'react';

export function useMatchMobile() {
  const [mobile, setMobile] = useState<undefined | boolean>();
  useEffect(() => {
    setMobile(/iPhone|Android/i.test(navigator.userAgent));

    const handleResize = () => {
      setMobile(
        /iPhone|Android/i.test(navigator.userAgent) || window.innerWidth < 768,
      );
    };

    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      handleResize(); // Initial check

      window.addEventListener('resize', handleResize);
    }

    return () => {
      if (typeof window !== 'undefined' && typeof navigator !== 'undefined'){
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  return mobile;
}

export function useMatchPad() {
  const [isPad, setIsPad] = useState<undefined | boolean>();

  useEffect(() => {
    const userAgent = navigator.userAgent;

    const padRegex = /(iPad|Android|Tablet)/i;
    const excludeRegex = /Mobile/i;

    const isPadDevice = padRegex.test(userAgent); // && !excludeRegex.test(userAgent);

    setIsPad(isPadDevice);
  }, []);

  return isPad;
}
