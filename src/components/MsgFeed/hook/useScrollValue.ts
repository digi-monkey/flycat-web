import { useState, useEffect } from 'react';
import { useDebounce } from 'usehooks-ts';

export const useScrollValue = (debounceDelay = 700) => {
  const [scrollValue, setScrollValue] = useState(0);

  const handleScroll = () => {
    setScrollValue(window.scrollY);
  };

  const debouncedHandleScroll = useDebounce(handleScroll, debounceDelay);

  useEffect(() => {
    window.addEventListener('scroll', debouncedHandleScroll);

    return () => {
      window.removeEventListener('scroll', debouncedHandleScroll);
    };
  }, [debouncedHandleScroll]);

  return scrollValue;
};

export default useScrollValue;
