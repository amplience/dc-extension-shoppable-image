import "./edit-toolbar.css";
import clsx from "clsx";
import { EditorMode } from "../../core/EditorContext";
import { useEditorContext } from "../../core/EditorContext";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Undo from "@mui/icons-material/Undo";

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
          <Button
            variant="contained"
            color={mode === EditorMode.EditorPoi ? "primary" : "secondary"}
            onClick={() => changeMode(EditorMode.EditorPoi)}
            disableElevation
          >
            Focal Point
          </Button>

          <Button
            variant="contained"
            color={mode === EditorMode.EditorHotspot ? "primary" : "secondary"}
            onClick={() => changeMode(EditorMode.EditorHotspot)}
            disableElevation
          >
            Hotspots
          </Button>

          <Button
            variant="contained"
            color={
              mode === EditorMode.EditorPolygonRect ? "primary" : "secondary"
            }
            onClick={() => changeMode(EditorMode.EditorPolygonRect)}
            disableElevation
          >
            Polygon
          </Button>

          <Divider orientation="vertical" variant="middle" flexItem />

          <Button
            variant="contained"
            color="secondary"
            className="amp-edit-toolbar__reset"
            disableElevation
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
