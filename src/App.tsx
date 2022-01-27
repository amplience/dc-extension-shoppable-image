import "./App.css";
import { WithEditorContext } from "./core/EditorContext";
import { PreviewCanvas } from "./preview/preview-canvas/preview-canvas";
import { EditToolbar } from "./preview/edit-toolbar/edit-toolbar";
import { WithExtensionContext } from "./core/ExtensionContext";
import { ThemeProvider } from "@emotion/react";
import { theme } from "./theme";
import { MetadataList } from "./metadata/metadata-list/metadata-list";
import { WithVisualizationContext } from "./visualization/visualization-context";
import { VisPage } from "./visualization/vis-page/vis-page";
import { WithWindowContext } from "./core/WindowContext";
import { Checkbox, FormControlLabel, FormGroup } from "@mui/material";
import { useState } from "react";

function App() {
  const params = new URL(document.location.href).searchParams;
  const vse = params.get("vse");
  const fieldName = params.get("fieldName") || "shoppableImage";

  const [hotspotHide, setHotspotHide] = useState(false);

  return (
    <div className="amp-app">
      <ThemeProvider theme={theme}>
        <WithWindowContext>
          {vse != null ? (
            <WithVisualizationContext fieldName={fieldName}>
              <div className="amp-app-vis-toolbar">
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={hotspotHide}
                        onChange={(evt) => setHotspotHide(evt.target.checked)}
                      />
                    }
                    label="Hide Hotspots"
                  />
                </FormGroup>
              </div>
              <VisPage hotspotHide={hotspotHide} vse={vse} />
            </WithVisualizationContext>
          ) : (
            <WithEditorContext>
              <WithExtensionContext>
                <EditToolbar />
                <PreviewCanvas />
                <MetadataList />
              </WithExtensionContext>
            </WithEditorContext>
          )}
        </WithWindowContext>
      </ThemeProvider>
    </div>
  );
}

export default App;
