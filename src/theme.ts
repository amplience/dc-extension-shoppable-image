import { createTheme } from "@mui/material/styles";

const primaryBlue = "#039be5";

export const theme = createTheme({
  palette: {
    primary: {
      main: primaryBlue,
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#ffffff",
    },
    error: {
      main: "#ff3366",
    },
    contrastThreshold: 3,
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: "none",
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          color: "white",
          "&:hover": {
            backgroundColor: primaryBlue,
          },
        },
      },
    },
    MuiTooltip: {
      defaultProps: {
        arrow: true,
      },
      styleOverrides: {
        arrow: {
          color: "#1A222D",
        },
        tooltipArrow: {
          borderRadius: "2px",
          padding: "6px 12px 6px 12px",
          backgroundColor: "#1A222D",
          textAlign: "center",
        },
      },
    },
  },
});
