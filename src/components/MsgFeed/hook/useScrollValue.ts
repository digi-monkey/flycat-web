import { useState, useEffect } from 'react';
import { useDebounce } from 'usehooks-ts';

export const useScrollValue = (debounceDelay = 700) => {
  const [scrollValue, setScrollValue] = useState(0);
  const debounceScrollValue = useDebounce(scrollValue, debounceDelay);

  useEffect(() => {
    const handleScroll = () => {
      setScrollValue(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return debounceScrollValue;
};

export default useScrollValue;
