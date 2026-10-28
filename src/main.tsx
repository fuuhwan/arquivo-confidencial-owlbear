import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { iniciarMenuToken } from "./menu-token";
import { iniciarBarrasToken } from "./barras-token";

const parametros = new URLSearchParams(
  window.location.search,
);

if (parametros.get("modo") === "fundo") {
  iniciarMenuToken();
  iniciarBarrasToken();
} else {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}