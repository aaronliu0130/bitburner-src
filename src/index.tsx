import React from "react";
import ReactDOM from "react-dom";

import { TTheme as Theme } from "./ui/React/Theme";
import { LoadingScreen } from "./ui/LoadingScreen";
import "./engineStyle";

ReactDOM.render(
  <Theme>
    <LoadingScreen />
  </Theme>,
  document.getElementById("mainmenu-container"),
);
