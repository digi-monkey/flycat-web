import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: 'rgb(141, 197, 63)',
    },
    secondary: {
      main: 'rgb(244, 245, 244)',
    },
    info: {
      main: 'rgb(219, 213, 213)',
    },
  },
  typography: {
    button: {
      textTransform: 'none',
    },
  }
});

export default theme;
