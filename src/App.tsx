import "./App.css";
import { WithEditorContext } from "./core/EditorContext";
import { PreviewCanvas } from "./preview/preview-canvas/preview-canvas";
import { EditToolbar } from "./preview/edit-toolbar/edit-toolbar";
import { WithExtensionContext } from "./core/ExtensionContext";
import { ThemeProvider } from "@emotion/react";
import { theme } from "./theme";
import { MetadataList } from "./metadata/metadata-list/metadata-list";

function App() {
  return (
    <div className="amp-app">
      <ThemeProvider theme={theme}>
        <WithEditorContext>
          <WithExtensionContext>
            <EditToolbar />
            <PreviewCanvas />
            <MetadataList />
          </WithExtensionContext>
        </WithEditorContext>
      </ThemeProvider>
    </div>
  );
}

export default App;
