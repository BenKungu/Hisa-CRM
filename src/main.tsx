import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import store from "./core/redux/store";
import { base_path } from "./environment";
import { BrowserRouter } from "react-router-dom";
import ALLRoutes from "./routes/router";
import DynamicTitle from "./routes/dynamicTitle";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "@fortawesome/fontawesome-free/css/fontawesome.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "react-datepicker/src/stylesheets/datepicker.scss";
import "./assets/css/feathericon.min.css";
import "./assets/scss/main.scss";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter basename={base_path}>
        <ALLRoutes />
        <DynamicTitle />
      </BrowserRouter>
    </Provider>
  </StrictMode>
);
