
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

createRoot(document.getElementById("root")).render(<App />);

if (screen.orientation?.lock) {
  screen.orientation.lock("landscape").catch(() => {});
}
