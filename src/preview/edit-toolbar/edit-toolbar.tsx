import "./edit-toolbar.css";
import clsx from "clsx";
import { EditorMode } from "../../core/EditorContext";
import { AIState } from "../../core/AIImageData";
import { useEditorContext } from "../../core/EditorContext";
import { useExtensionContext } from "../../core/ExtensionContext";
import {
  Menu,
  MenuItem,
  Tooltip,
  Button,
  Divider,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Undo,
  Redo,
  CircleOutlined,
  CropSquareSharp,
  GpsFixed,
  HighlightAlt,
  HighlightOff,
} from "@mui/icons-material";
import React from "react";

export function EditToolbar({ className }: { className?: string }) {
  const { mode, toggleAIDrawer, setDrawerVisible, changeMode, ai } =
    useEditorContext();
  const { undoHistory, undo, redoHistory, redo, params } =
    useExtensionContext();
  const [anchorEl, setAnchorEl] = React.useState<Element | null>(null);
  const [showError, setShowError] = React.useState(true);
  const open = anchorEl != null;
  const error = ai.state === AIState.Error;

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
              data-id="focal-point"
              onClick={() => {
                changeMode(EditorMode.EditorPoi);
                setAnchorEl(null);
              }}
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
              data-id="hotspots"
              onClick={() => {
                changeMode(EditorMode.EditorHotspot);
                setAnchorEl(null);
              }}
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
              data-id="polygon-hotspot"
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
              data-id="rectangular-hotspot"
            >
              Rectangular Hotspot
            </MenuItem>
            <MenuItem
              onClick={() => {
                changeMode(EditorMode.EditorPolygonCircle);
                handleClose();
              }}
              data-id="circular-hotspot"
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
            data-id="undo"
            onClick={() => {
              if (undo) {
                undo();
              }
            }}
          >
            <Undo />
          </Button>

          <Button
            variant="contained"
            color="secondary"
            className="amp-edit-toolbar__reset"
            disableElevation
            disabled={redoHistory.length === 0}
            data-id="redo"
            onClick={() => {
              if (redo) {
                redo();
              }
            }}
          >
            <Redo />
          </Button>

          <Divider orientation="vertical" variant="middle" flexItem />
          <Button
            variant="contained"
            color={ai.drawerOpen ? "primary" : "secondary"}
            data-id="ai-assistant"
            onClick={() => {
              if (toggleAIDrawer) {
                toggleAIDrawer();
              }
              setAnchorEl(null);
            }}
          >
            AI Assistant
          </Button>
        </div>
      </div>
      <div className="amp-edit-toolbar__right">
        <Button
          variant="contained"
          color="primary"
          data-id="done"
          onClick={() => {
            changeMode(EditorMode.Initial);
            setDrawerVisible(false);
            setAnchorEl(null);
          }}
          disableElevation
        >
          Done
        </Button>
      </div>
      {error && (
        <Snackbar
          open={showError}
          onClose={() => {
            setShowError(false);
          }}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  setShowError(false);
                }}
              >
                OK
              </Button>
            }
          >
            Error fetching AI Objects
          </Alert>
        </Snackbar>
      )}
    </div>
  );
}
