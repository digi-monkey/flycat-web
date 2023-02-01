import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  html,
  body {
    height: 100%;
    width: 100%;
    background: #e0e0e0;
  }

  body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  }

  #root {
    min-height: 100%;
    min-width: 100%;
  }

  p,
  label {
    font-family: Georgia, Times, 'Times New Roman', serif;
    line-height: 1.5em;
  }

  input, select {
    font-family: inherit;
    font-size: inherit;
  }

  .menu a {
    text-decoration: none;
  }
  .menu a:hover{
    background-color:#06c;
	  color:#fff;
	  text-decoration:none
  }

  textarea:focus {
    outline: none;
  }

  button:hover {
    cursor:pointer;
   }
`;
