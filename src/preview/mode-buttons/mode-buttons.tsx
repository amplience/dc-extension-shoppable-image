import Fab from "@mui/material/Fab";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import DeleteIcon from "@mui/icons-material/Delete";
import "./mode-buttons.css";
import Tooltip from "@mui/material/Tooltip";
import { useExtensionContext } from "../../core/ExtensionContext";
import { EditorMode, useEditorContext } from "../../core/EditorContext";

export function ModeButtons() {
  const { sdk, field, setField, clearUndo } = useExtensionContext();
  const { mode, changeMode } = useEditorContext();

  const showButtons = mode === EditorMode.Initial;
  const hasImage = field?.image?.id;

  const modeButton = async (mode: EditorMode): Promise<void> => {
    if (sdk && field && setField && clearUndo) {
      switch (mode) {
        case EditorMode.Swap:
          field.image = await sdk.mediaLink.getImage();

          field.poi = {} as any;
          field.hotspots = [];
          field.polygons = [];

          clearUndo();
          setField();
          changeMode(EditorMode.EditorPoi);
          break;
        case EditorMode.Delete:
          field.image = { _empty: true } as any;
          field.poi = {} as any;
          field.hotspots = [];
          field.polygons = [];
          clearUndo();
          setField();
          break;
        default:
          changeMode(mode);
          break;
      }
    }
  };

  if (!showButtons) {
    return <></>;
  }

  return (
    <div className={`amp-mode-buttons ${!hasImage ? 'empty' : ''}`}>
      {hasImage && (
        <>
          <Tooltip title="Edit image & focal point">
            <Fab onClick={() => modeButton(EditorMode.EditorPoi)}>
              <EditIcon />
            </Fab>
          </Tooltip>
          <Tooltip title="Replace">
            <Fab onClick={() => modeButton(EditorMode.Swap)}>
              <SwapHorizIcon />
            </Fab>
          </Tooltip>
          <Tooltip title="Remove">
            <Fab onClick={() => modeButton(EditorMode.Delete)}>
              <DeleteIcon />
            </Fab>
          </Tooltip>
        </>
      )}
      {!hasImage && (
        <Tooltip title="Set image">
          <Fab onClick={() => modeButton(EditorMode.Swap)}>
            <AddIcon />
          </Fab>
        </Tooltip>
      )}
    </div>
  );
}
