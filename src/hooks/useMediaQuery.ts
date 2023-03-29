import { useEffect, useState } from "react";

export function useMatchMobile() {
  const [mobile, setMobile] = useState<undefined | boolean>();
  useEffect(() => setMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)), []);

  return mobile;
}