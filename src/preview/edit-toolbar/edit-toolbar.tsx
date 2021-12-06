import "./edit-toolbar.css";
import clsx from "clsx";
import { EditorMode } from "../../core/EditorContext";
import { useEditorContext } from "../../core/EditorContext";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Undo from "@mui/icons-material/Undo";
import { Tooltip } from "@mui/material";
import { GpsFixed, HighlightAlt } from "@mui/icons-material";

export function EditToolbar({ className }: { className?: string }) {
  const { mode, changeMode } = useEditorContext();

  return (
    <div
      className={clsx("amp-edit-toolbar", className, {
        "amp-root__topbar--hide": mode === EditorMode.Initial,
      })}
    >
      <div className="amp-edit-toolbar__modescroll">
        <div className="amp-edit-toolbar__modes">
          <Tooltip title="Click to reposition the Focal Point.">
            <Button
              variant="contained"
              color={mode === EditorMode.EditorPoi ? "primary" : "secondary"}
              onClick={() => changeMode(EditorMode.EditorPoi)}
              disableElevation
            >
              <GpsFixed className="amp-edit-toolbar__modeicon" />
              Focal Point
            </Button>
          </Tooltip>

          <Tooltip title="Click to place a new Hotspot, or drag an existing one.">
            <Button
              variant="contained"
              color={mode === EditorMode.EditorHotspot ? "primary" : "secondary"}
              onClick={() => changeMode(EditorMode.EditorHotspot)}
              disableElevation
            >
              <HighlightAlt className="amp-edit-toolbar__modeicon" />
              Hotspots
            </Button>
          </Tooltip>

          <Divider orientation="vertical" variant="middle" flexItem />

          <Button
            variant="contained"
            color="secondary"
            className="amp-edit-toolbar__reset"
            disableElevation
            disabled
          >
            <Undo />
          </Button>
        </div>
      </div>
      <div className="amp-edit-toolbar__right">
        <Button
          variant="contained"
          color="primary"
          onClick={() => changeMode(EditorMode.Initial)}
          disableElevation
        >
          Done
        </Button>
      </div>
    </div>
  );
}
