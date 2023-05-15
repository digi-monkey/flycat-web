import { useEffect, useState } from "react";

export function useMatchMobile() {
  const [mobile, setMobile] = useState<undefined | boolean>();
  useEffect(() => setMobile(/iPhone|Android/i.test(navigator.userAgent)), []);

  return mobile;
}
