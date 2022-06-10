import "./App.css";
import { WithEditorContext } from "./core/EditorContext";
import { PreviewCanvas } from "./preview/preview-canvas/preview-canvas";
import { EditToolbar } from "./preview/edit-toolbar/edit-toolbar";
import { WithExtensionContext } from "./core/ExtensionContext";
import { ThemeProvider } from "@emotion/react";
import { theme } from "./theme";
import { MetadataList } from "./metadata/metadata-list/metadata-list";
import { WithVisualizationContext } from "./visualization/visualization-context";
import { WithWindowContext } from "./core/WindowContext";
import { VisContainer } from "./visualization/vis-container/vis-container";
import { Title } from "./preview/title/title";

function App() {
  const params = new URL(document.location.href).searchParams;
  const vse = params.get("vse");
  const fieldName = params.get("fieldName") || "shoppableImage";

  return (
    <div className="amp-app">
      <ThemeProvider theme={theme}>
        <WithWindowContext>
          {vse != null ? (
            <WithVisualizationContext fieldName={fieldName}>
              <VisContainer vse={vse} />
            </WithVisualizationContext>
          ) : (
            <WithExtensionContext>
              <WithEditorContext>
                <Title />
                <div className="amp-app-clip">
                  <EditToolbar />
                  <PreviewCanvas />
                  <MetadataList />
                </div>
              </WithEditorContext>
            </WithExtensionContext>
          )}
        </WithWindowContext>
      </ThemeProvider>
    </div>
  );
}

export default App;
