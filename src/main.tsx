import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import "./styles/tokens.css";
import "./styles/reset.css";
import "./styles/bootstrap-partial.css";
import "./styles/tailwind.css";
import "./styles/animations.css";
import "./styles/global.css";

const muiTheme = createTheme({
    palette: {
        mode: "dark",
        primary: { 
            main: "var(--color-accent)", 
            light: "var(--color-accent)", 
            dark: "var(--color-accent)", 
            contrastText: "#fff" 
        },
        success: { 
            main: "var(--color-success)", 
            light: "var(--color-success)", 
            dark: "var(--color-success)", 
            contrastText: "#fff" 
        },
        warning: { 
            main: "var(--color-warning)", 
            light: "var(--color-warning)", 
            dark: "var(--color-warning)", 
            contrastText: "#000" 
        },
        error: { 
            main: "var(--color-danger)", 
            light: "var(--color-danger)", 
            dark: "var(--color-danger)", 
            contrastText: "#fff" 
        },
        background: { default: "transparent", paper: "var(--color-bg-panel)" },
        text: {
            primary: "var(--color-text-primary)",
            secondary: "var(--color-text-secondary)",
        },
    },
    components: {
        MuiCssBaseline: { styleOverrides: { body: { background: "transparent" } } },
        MuiSlider: { defaultProps: { disableSwap: true } },
    },
});

class GlobalErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: 40, background: 'rgba(20,0,0,0.9)', color: 'white', width: '100vw', height: '100vh', zIndex: 9999 }}>
                    <h1 style={{ color: '#ff5555' }}>React Runtime Error</h1>
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginTop: 20 }}>
                        {this.state.error?.toString()}
                        <br/>
                        {this.state.error?.stack}
                    </pre>
                </div>
            );
        }
        return this.props.children;
    }
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <GlobalErrorBoundary>
            <ThemeProvider theme={muiTheme}>
                <CssBaseline enableColorScheme />
                <App />
            </ThemeProvider>
        </GlobalErrorBoundary>
    </React.StrictMode>,
);
