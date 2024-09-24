import Fab from "@mui/material/Fab";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import DeleteIcon from "@mui/icons-material/Delete";
import "./mode-buttons.css";
import Tooltip from "@mui/material/Tooltip";
import { useExtensionContext } from "../../core/ExtensionContext";
import { EditorMode, useEditorContext } from "../../core/EditorContext";
import { Box } from "@mui/material";
import { useState } from "react";
import { useImageStudioContext } from "../../core/ImageStudioContext";
import ImageStudioIcon from "../../icons/ic-image-studio.svg";

export function ModeButtons() {
  const { sdk, field, setField, clearUndo, setThumbUrl } =
    useExtensionContext();
  const { mode, changeMode, clearAi, setDrawerVisible } = useEditorContext();
  const { openImageStudio } = useImageStudioContext();

  const [, setHover] = useState(false);

  const handleMouseEnter = () => setHover(true);
  const handleMouseLeave = () => setHover(false);

  const showButtons = mode === EditorMode.Initial;
  const hasImage = field && field?.image?.id;

  const modeButton = async (mode: EditorMode): Promise<void> => {
    if (sdk && field && setField && clearUndo) {
      switch (mode) {
        case EditorMode.Swap:
          const image = await sdk.mediaLink.getImage();
          const asset = await sdk.assets.getById(image.id);

          setThumbUrl(asset.thumbURL);

          field.image = image;
          field.poi = {} as any;
          field.hotspots = [];
          field.polygons = [];

          clearUndo();
          setField();
          changeMode(EditorMode.EditorPoi);
          break;
        case EditorMode.Delete:
          field.image = undefined;
          field.poi = {} as any;
          field.hotspots = [];
          field.polygons = [];
          clearUndo();
          setField();
          break;
        case EditorMode.ImageStudio:
          openImageStudio(field);
          break;
        default:
          changeMode(mode);
          setDrawerVisible(true);
          break;
      }
    }
  };

  if (!showButtons) {
    return <></>;
  }

  return (
    <Box
      className="amp-mode-buttons-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {!hasImage && (
        <div className="amp-mode-buttons__empty">
          <Tooltip title="Add" placement="top">
            <Fab
              className="amp-mode__add"
              onClick={() => modeButton(EditorMode.Swap)}
            >
              <AddIcon />
            </Fab>
          </Tooltip>
          Add a shoppable image
        </div>
      )}

      {hasImage && (
        <div className="amp-mode-buttons">
          <Tooltip title="Edit in Image Studio">
            <Fab onClick={() => modeButton(EditorMode.ImageStudio)}>
              <img src={ImageStudioIcon} alt="Edit in Image Studio icon" />
            </Fab>
          </Tooltip>
          <Tooltip title="Edit image & focal point">
            <Fab onClick={() => modeButton(EditorMode.EditorPoi)}>
              <EditIcon />
            </Fab>
          </Tooltip>
          <Tooltip title="Replace">
            <Fab
              onClick={() => {
                modeButton(EditorMode.Swap);
                clearAi();
              }}
            >
              <SwapHorizIcon />
            </Fab>
          </Tooltip>
          <Tooltip title="Remove">
            <Fab
              onClick={() => {
                modeButton(EditorMode.Delete);
                clearAi();
              }}
            >
              <DeleteIcon />
            </Fab>
          </Tooltip>
        </div>
      )}
    </Box>
  );
}
