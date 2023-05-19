import { useEffect, useState } from "react";

export function useMatchMobile() {
  const [mobile, setMobile] = useState<undefined | boolean>();
  useEffect(() => setMobile(/iPhone|Android/i.test(navigator.userAgent)), []);

  return mobile;
}

export function useMatchPad() {
  const [isPad, setIsPad] = useState<undefined | boolean>();

  useEffect(() => {
    const userAgent = navigator.userAgent;

    const padRegex = /(iPad|Android|Tablet)/i;
    const excludeRegex = /Mobile/i;

    // 进行匹配判断
    const isPadDevice = padRegex.test(userAgent); // && !excludeRegex.test(userAgent);

    setIsPad(isPadDevice);
  }, []);

  return isPad;
}
