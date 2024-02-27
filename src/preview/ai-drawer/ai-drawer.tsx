import "./ai-drawer.css";
import { useEditorContext, EditorMode } from "../../core/EditorContext";
import { useExtensionContext } from "../../core/ExtensionContext";
import { AIState, ObjectData } from "../../core/AIImageData";
import React, { useState } from "react";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import {
  Drawer,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
  CircularProgress,
  Alert,
  AlertTitle,
  Link,
} from "@mui/material";
import { Add, Delete, AutoAwesome } from "@mui/icons-material";

export function AIDrawer() {
  const { fetchAI, ai, mode, changeMode, toggleAIDrawer, aspect } =
    useEditorContext();
  const { field, setUndo, setField, sdk } = useExtensionContext();
  const loading = ai.state === AIState.Loading;
  const insufficientCredits = ai.state === AIState.InsufficientCredits;

  const modeToAction = (exists: boolean) => {
    switch (mode) {
      case EditorMode.EditorHotspot:
      case EditorMode.EditorGrab:
      case EditorMode.EditorPolygonRect:
      case EditorMode.EditorPolygonCircle:
        return exists ? <Delete /> : <Add />;
      case EditorMode.EditorPoi:
        return "set";
    }
  };

  const exists = (id: string): boolean => {
    if (!field) return false;
    switch (mode) {
      case EditorMode.EditorHotspot:
        return (
          field.hotspots?.find((hotspot) => hotspot.id === id) !== undefined ||
          false
        );
      case EditorMode.EditorGrab:
      case EditorMode.EditorPolygonRect:
      case EditorMode.EditorPolygonCircle:
        return (
          field.polygons?.find((poly) => poly.id === id) !== undefined || false
        );
    }
    return false;
  };

  const addAll = () => {
    ai.objects.forEach((obj: ObjectData) => {
      if (exists(obj.id)) return;
      addSingle(obj);
    });
  };

  const addSingle = (obj: ObjectData) => {
    if (setUndo) setUndo();
    switch (mode) {
      case EditorMode.EditorHotspot:
        addHotspot(obj);
        break;
      case EditorMode.EditorGrab:
      case EditorMode.EditorPolygonRect:
      case EditorMode.EditorPolygonCircle:
        addPolygon(obj);
        break;
      case EditorMode.EditorPoi:
        setFocalPoint(obj);
    }
    setField && setField();
  };

  const removeSingle = (obj: ObjectData) => {
    if (setUndo) setUndo();
    switch (mode) {
      case EditorMode.EditorHotspot:
        removeHotspot(obj);
        break;
      case EditorMode.EditorGrab:
      case EditorMode.EditorPolygonRect:
      case EditorMode.EditorPolygonCircle:
        removePolygon(obj);
        break;
    }
    setField && setField();
  };

  const removeHotspot = ({ id }: ObjectData) => {
    if (!field) return;
    if (!field.hotspots) return;
    const index = field.hotspots.findIndex((hotspot) => hotspot.id === id);
    if (index === -1) return;
    field.hotspots.splice(index, 1);
  };

  const removePolygon = ({ id }: ObjectData) => {
    if (!field) return;
    if (!field.polygons) return;
    const index = field.polygons.findIndex((poly) => poly.id === id);
    if (index === -1) return;
    field.polygons.splice(index, 1);
  };

  const addHotspot = ({ id, center, target, selector }: ObjectData) => {
    if (!field) return;

    if (!field.hotspots) {
      field.hotspots = [];
    }

    const shoppableHotspot = {
      id,
      selector,
      points: {
        x: center.x,
        y: center.y,
      },
      target,
    };

    field.hotspots.push(shoppableHotspot);
  };

  const addPolygon = ({ id, outline, target, selector }: ObjectData) => {
    if (!field) return;

    if (!field.polygons) {
      field.polygons = [];
    }

    if (!outline || outline.length === 0) {
      outline = [
        {
          x: 0,
          y: 0,
        },
        {
          x: 1,
          y: 0,
        },
        {
          x: 1,
          y: 1,
        },
        {
          x: 0,
          y: 1,
        },
      ];
    }

    const shoppablePolygon = {
      id,
      selector,
      points: outline,
      target,
    };

    field.polygons.push(shoppablePolygon);
  };

  const setFocalPoint = ({ bounds }: ObjectData) => {
    if (!field) return;
    const w = 0.15 * aspect.x;
    const h = 0.15 * aspect.y;
    const focusPoint = {
      x: bounds!.topLeft.x + bounds!.width / 2 - w / 2,
      y: bounds!.topLeft.y + bounds!.height / 2 - h / 2,
      w,
      h,
    };

    field.poi = focusPoint;
  };

  const shouldDisplayDetectButton = () => {
    return !ai.objects || ai.objects.length < 1;
  };

  const shouldDisplayAiTools = () => {
    return !shouldDisplayDetectButton();
  };

  const transformMode = (mode: EditorMode) => {
    // AI panel just has a radio button for both polygon modes - remap happens here
    switch (mode) {
      case EditorMode.EditorPolygonCircle:
        return EditorMode.EditorGrab;
      case EditorMode.EditorPolygonRect:
        return EditorMode.EditorGrab;
      default:
        return mode;
    }
  };

  return (
    <Drawer
      anchor="right"
      open={ai.drawerOpen}
      onClose={() => toggleAIDrawer()}
      className="amp-ai-drawer"
    >
      <div className="amp-drawer-title">
        <AutoAwesome /> Auto object detection
      </div>
      {insufficientCredits && (
        <>
          <Typography className="amp-ai-drawer-instructions" color={"red"}>
            You're out of Amplience credits. You can still add an image focal
            point and hotspots manually.
            <br />
            <Link
              target="_blank"
              href="https://amplience.com/ai-credits/"
              underline="none"
            >
              Top up your credits
            </Link>
          </Typography>
        </>
      )}
      {shouldDisplayDetectButton() && (
        <>
          <Typography className="amp-ai-drawer-instructions">
            Use AI Assistant to automatically detect relevant objects in your
            image. These can then be set as a focal point, hotspot or polygon.
          </Typography>
          <FormControl className="amp-ai-detect-button-form">
            <Button
              variant="contained"
              disabled={loading}
              data-id="automatically-detect"
              onClick={() => fetchAI()}
            >
              {loading && (
                <CircularProgress
                  className="amp-edit-toolbar__status"
                  size={12}
                />
              )}
              Detect objects
            </Button>
          </FormControl>
        </>
      )}

      {shouldDisplayAiTools() && (
        <>
          <AIToolSelect mode={transformMode(mode)} setMode={changeMode} />
          {mode !== EditorMode.EditorPoi && (
            <Button
              variant="contained"
              className="amp-ai-drawer__button__large"
              data-id="add-all"
              onClick={() => {
                addAll();
              }}
            >
              Add all
            </Button>
          )}
        </>
      )}

      <TableContainer className="amp-ai-drawer__table">
        <Table aria-label="AI Object List">
          <TableBody>
            {ai.objects.map((obj: ObjectData) => {
              return (
                <TableRow key={obj.id}>
                  <TableCell component="th">{obj.target}</TableCell>
                  <TableCell align="right">
                    <Button
                      variant="contained"
                      className={
                        exists(obj.id) ? "amp-ai-drawer__button__remove" : ""
                      }
                      onClick={() => {
                        exists(obj.id) ? removeSingle(obj) : addSingle(obj);
                      }}
                    >
                      {modeToAction(exists(obj.id))}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Drawer>
  );
}

export function AIToolSelect({
  mode,
  setMode,
}: {
  mode: EditorMode;
  setMode: (mode: EditorMode) => void;
}) {
  return (
    <FormControl className="amp-ai-drawer__form">
      <RadioGroup
        row
        aria-labelledby="demo-row-radio-buttons-group-label"
        name="row-radio-buttons-group"
        onChange={(evt) => setMode(Number(evt.target.value) as EditorMode)}
        value={mode}
      >
        <FormControlLabel
          value={EditorMode.EditorPoi}
          control={<Radio />}
          label={
            <>
              <span>Focal Point</span>
            </>
          }
        />
        <FormControlLabel
          value={EditorMode.EditorHotspot}
          control={<Radio />}
          label={
            <>
              <span>Hotspot</span>
            </>
          }
        />
        <FormControlLabel
          value={EditorMode.EditorGrab}
          control={<Radio />}
          label={
            <>
              <span>Polygon</span>
            </>
          }
        />
      </RadioGroup>
    </FormControl>
  );
}
