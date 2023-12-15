import React, { useState, useEffect } from 'react';

const ASCIIArtAnimation: React.FC = () => {
  const [asciiArt, setAsciiArt] = useState<string>(''); // Initial state is an empty string

  useEffect(() => {
    // ASCII art frames representing the animation
    const frames = [
      String.raw`
      ⢀ /\___/\
       )       (
      =\       /=
        )     (
       /       \
      /         \
      \         /
       \__  __/
          ))
         //
        ((
         \)
`,
      String.raw`
      ⢀ /\___/\
       )       (
      =\       /=
        )     (
       /       \
      /         \
      \         /
       \__  __/
           ))
          //
         ((
           \)⠀
          `,
      String.raw`
      ⢀ /\___/\
       )       (
      =\       /=
        )     (
       /       \
      /         \
      \         /
       \__  __/
            ))
          //
          ((
            \)⠁⠀
          `,
    ];

    let frameIndex = 0;

    const interval = setInterval(() => {
      setAsciiArt(frames[frameIndex]);
      frameIndex = (frameIndex + 1) % frames.length;
    }, 1000); // Change frames every second

    // Cleanup interval on component unmount
    return () => {
      clearInterval(interval);
    };
  }, []); // Empty dependency array ensures this effect runs once after the initial render

  return <pre>{asciiArt}</pre>;
};

export default ASCIIArtAnimation;
