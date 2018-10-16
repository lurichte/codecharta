import "../rangeSlider/rangeSlider";
import "../../core/core.module";

import angular from "angular";

import {multipleFilePanelComponent} from "./multipleFilePanelComponent";

angular.module("app.codeCharta.ui.multipleSettingsPanel", ["app.codeCharta.ui.rangeSlider", "app.codeCharta.core"])
    .component(multipleFilePanelComponent.selector, multipleFilePanelComponent);


