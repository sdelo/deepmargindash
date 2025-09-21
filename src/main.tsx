import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { applyTheme, setTheme } from "./theme";

function Root() {
  useEffect(() => {
    setTheme("leviathan");
    // Expose a quick switch for manual testing in console: window.setTheme('leviathan'|'default')
    (window as any).setTheme = setTheme;
  }, []);
  return <App />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
