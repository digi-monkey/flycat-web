import React, { useState } from 'react';

function DynamicScriptComponent() {
  const [moduleString, setModuleString] = useState('');
  const [moduleLoaded, setModuleLoaded] = useState(false);

  const handleModuleChange = e => {
    setModuleString(e.target.value);
  };

  const handleExecuteModule = () => {
    // Create a blob from the module string
    const blob = new Blob([moduleString], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);

    // Create a script element and set its source to the blob URL
    const script = document.createElement('script');
    script.src = url;
    script.type = 'module'; // Specify module type for ES6 module support

    // Append the script to the document body to execute it
    document.body.appendChild(script);

    // Set moduleLoaded to true once the script has finished loading and executing
    script.onload = () => {
      setModuleLoaded(true);

      // Clean up by revoking the blob URL
      URL.revokeObjectURL(url);
    };
  };

  const handleUseModule = () => {
    if (moduleLoaded) {
      // You can now use functions and variables from the dynamically loaded module
      // For example, if your module exports a function called myFunction:
      // myFunction();
      console.log('loaded!');
    } else {
      console.log('Module not loaded yet');
    }
  };

  return (
    <div>
      <textarea
        value={moduleString}
        onChange={handleModuleChange}
        placeholder="Enter JavaScript module string here"
        rows={10}
        cols={50}
      />
      <button onClick={handleExecuteModule}>Execute Module</button>
      <button onClick={handleUseModule}>Use Module</button>
    </div>
  );
}

export default DynamicScriptComponent;
