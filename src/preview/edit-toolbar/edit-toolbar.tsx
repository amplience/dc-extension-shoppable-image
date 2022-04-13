import "./edit-toolbar.css";
import clsx from "clsx";
import { EditorMode } from "../../core/EditorContext";
import { useEditorContext } from "../../core/EditorContext";
import { useExtensionContext } from "../../core/ExtensionContext";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Undo from "@mui/icons-material/Undo";
import { Menu, MenuItem, Tooltip } from "@mui/material";
import {
  CircleOutlined,
  CropSquareSharp,
  GpsFixed,
  HighlightAlt,
  HighlightOff
} from "@mui/icons-material";
import React from "react";

export function EditToolbar({ className }: { className?: string }) {
  const { mode, changeMode } = useEditorContext();
  const { undoHistory, undo } = useExtensionContext();
  const [anchorEl, setAnchorEl] = React.useState<Element | null>(null);
  const open = anchorEl != null;

  const handleClose = () => {
    setAnchorEl(null);
  };

  const getPolygonIcon = () => {
    switch (mode) {
      case EditorMode.EditorPolygonRect:
        return <CropSquareSharp className="amp-edit-toolbar__modeicon" />;
      case EditorMode.EditorPolygonCircle:
        return <CircleOutlined className="amp-edit-toolbar__modeicon" />;
      default:
        return <HighlightAlt className="amp-edit-toolbar__modeicon" />;
    }
  };

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
              color={
                mode === EditorMode.EditorHotspot ? "primary" : "secondary"
              }
              onClick={() => changeMode(EditorMode.EditorHotspot)}
              disableElevation
            >
              <HighlightOff className="amp-edit-toolbar__modeicon amp-edit-toolbar__rot45" />
              Hotspots
            </Button>
          </Tooltip>

          <Tooltip title="Click to place a new Polygon Hotspot, or drag an existing one.">
            <Button
              variant="contained"
              color={
                mode === EditorMode.EditorGrab ||
                mode === EditorMode.EditorPolygonCircle ||
                mode === EditorMode.EditorPolygonRect
                  ? "primary"
                  : "secondary"
              }
              onClick={(evt) => {
                changeMode(EditorMode.EditorGrab);
                setAnchorEl(evt.currentTarget);
              }}
              disableElevation
            >
              {getPolygonIcon()}
              Polygon Hotspot
            </Button>
          </Tooltip>
          <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
            <MenuItem
              onClick={() => {
                changeMode(EditorMode.EditorPolygonRect);
                handleClose();
              }}
            >
              Rectangular Hotspot
            </MenuItem>
            <MenuItem
              onClick={() => {
                changeMode(EditorMode.EditorPolygonCircle);
                handleClose();
              }}
            >
              Circular Hotspot
            </MenuItem>
          </Menu>

          <Divider orientation="vertical" variant="middle" flexItem />

          <Button
            variant="contained"
            color="secondary"
            className="amp-edit-toolbar__reset"
            disableElevation
            disabled={undoHistory.length === 0}
            onClick={() => {
              if (undo) {
                undo();
              }
            }}
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
