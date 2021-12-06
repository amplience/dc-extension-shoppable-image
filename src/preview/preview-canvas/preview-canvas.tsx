import "./preview-canvas.css";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { useExtensionContext } from "../../core/ExtensionContext";
import { ModeButtons } from "../mode-buttons/mode-buttons";
import { CircularProgress } from "@mui/material";
import React from "react";
import {
  ShoppableImageHotspot,
  ShoppableImagePoi,
} from "../../core/ShoppableImageData";
import { MouseState } from "./mouse-state";
import { EditorMode, useEditorContext } from "../../core/EditorContext";
import { parseConfigFileTextToJson } from "typescript";

export function PreviewCanvas() {
  const { mode, selection, setSelection } = useEditorContext();
  const { sdk, field, setField } = useExtensionContext();
  const [loaded, setLoaded] = useState(false);
  const [imageSize, setImageSize] = useState({ w: -1, h: -1 });
  const [grabOffset, setGrabOffset] = useState({ x: 0, y: 0 });
  const [mouseState] = useState(new MouseState());

  const imageRef = React.createRef<HTMLImageElement>();
  const canvasRef = React.createRef<HTMLDivElement>();

  const targetHeight = 458;

  const imageLoaded = () => {
    setLoaded(true);
    if (imageRef.current) {
      setImageSize({ w: imageRef.current.width, h: imageRef.current.height });
    }
  };

  let canvas: JSX.Element | undefined;
  if (loaded) {
    const canvasWidth = (imageSize.w / imageSize.h) * targetHeight;

    const scale = targetHeight / imageSize.h;
    const aspect = targetHeight / canvasWidth;

    const scaleSize = (poi: ShoppableImagePoi): any => {
      return {
        transform: `translate(${poi.x * canvasWidth}px, ${
          poi.y * targetHeight
        }px)`,
        width: poi.w * canvasWidth + "px",
        height: poi.h * targetHeight + "px",
      };
    };

    const scaleHotspot = (hotspot: ShoppableImageHotspot): any => {
      return {
        transform: `translate(${hotspot.points.x * canvasWidth}px, ${
          hotspot.points.y * targetHeight
        }px)`,
      };
    };

    const getPageOffset = (elem: HTMLElement): { x: number; y: number } => {
      const offset = { x: 0, y: 0 };

      do {
        offset.x += elem.offsetLeft;
        offset.y += elem.offsetTop;
      } while (elem.parentElement != null && (elem = elem.parentElement));

      return offset;
    };

    const boundPoi = (poi: ShoppableImagePoi): ShoppableImagePoi => {
      if (poi.x < 0) poi.x = 0;
      if (poi.y < 0) poi.y = 0;
      if (poi.x + poi.w > 1) poi.x = 1 - poi.w;
      if (poi.y + poi.h > 1) poi.y = 1 - poi.h;

      return poi;
    };

    const getClickedHotspot = (
      x: number,
      y: number
    ): ShoppableImageHotspot | undefined => {
      // Step 1: Find the hotspot with the lowest distance.

      let bestHotspot: ShoppableImageHotspot | undefined;
      let bestDistanceSquared = Infinity;

      if (field && field.hotspots) {
        for (const hotspot of field.hotspots) {
          const point = hotspot.points;

          const dV = [Math.abs(x - point.x) * aspect, Math.abs(y - point.y)];
          const distSquared = dV[0] * dV[0] + dV[1] * dV[1];

          if (distSquared < bestDistanceSquared) {
            bestHotspot = hotspot;
            bestDistanceSquared = distSquared;
          }
        }
      }

      if (bestHotspot !== undefined) {
        // Step 2: Must be clicking near a hotspot to grab it.
        const hotspotGrabSizeSquared = 0.05 * 0.05;
        if (bestDistanceSquared > hotspotGrabSizeSquared) {
          bestHotspot = undefined;
        }
      }
      return bestHotspot;
    };

    const onDrag = (evt: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (canvasRef.current && field && setField) {
        const offset = getPageOffset(canvasRef.current);
        const x = (evt.pageX - offset.x) / canvasWidth;
        const y = (evt.pageY - offset.y) / targetHeight;

        switch (mode) {
          case EditorMode.EditorPoi:
            const width = 0.15 * aspect;
            const height = 0.15;

            field.poi = boundPoi({
              x: x - width / 2,
              y: y - height / 2,
              w: width,
              h: height,
            });
            break;
          case EditorMode.EditorHotspot:
            if (selection) {
              (selection as ShoppableImageHotspot).points = {
                x: x + grabOffset.x,
                y: y + grabOffset.y,
              };
            }
            break;
        }

        setField();
      }
    };

    const mouseMove = (evt: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (mouseState.isMouseDown) {
        onDrag(evt);
      }
    };

    const mouseDown = (evt: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      mouseState.mouseDown();
      if (canvasRef.current && field) {
        const offset = getPageOffset(canvasRef.current);
        const x = (evt.pageX - offset.x) / canvasWidth;
        const y = (evt.pageY - offset.y) / targetHeight;

        switch (mode) {
          case EditorMode.EditorPoi:
            // POI does not need selection.
            break;
          case EditorMode.EditorHotspot:
            if (!field.hotspots) {
              field.hotspots = [];
            }

            let moveHotspot = getClickedHotspot(x, y);

            if (!moveHotspot) {
              moveHotspot = {
                id: "id",
                target: "target",
                selector: "selector",
                points: {
                  x,
                  y,
                },
              };

              field.hotspots.push(moveHotspot);
            }

            setGrabOffset({
              x: moveHotspot.points.x - x,
              y: moveHotspot.points.y - y,
            });
            setSelection(moveHotspot);
            break;
        }
      }
    };

    const mouseUp = (evt: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      mouseState.mouseUp();
    };

    canvas = (
      <div
        className="amp-preview-canvas__interactive"
        style={{ width: canvasWidth + "px", height: "458px" }}
        ref={canvasRef}
        onMouseMove={mouseMove}
        onMouseDown={mouseDown}
        onMouseUp={mouseUp}
      >
        {field && field.poi && field.poi.x != null && (
          <div
            className={clsx("amp-preview-canvas__focalpoint", {
              "amp-preview-canvas__focalpoint--inactive":
                mode !== EditorMode.EditorPoi,
            })}
            style={scaleSize(field.poi)}
          >
            <div className="amp-preview-canvas__focalcircle"></div>
          </div>
        )}

        {field &&
          field.hotspots &&
          field.hotspots.map((hotspot, index) => (
            <div
              key={index}
              className={clsx("amp-preview-canvas__hotspot", {
                "amp-preview-canvas__hotspot--selected": selection === hotspot,
                "amp-preview-canvas__hotspot--inactive":
                  mode !== EditorMode.EditorHotspot,
              })}
              style={scaleHotspot(hotspot)}
            ></div>
          ))}
      </div>
    );
  }

  let image: JSX.Element | undefined;
  let src = "invalid";
  if (field && field.image.id) {
    const imageHost = sdk?.stagingEnvironment || field.image.defaultHost;
    src = `https://${imageHost}/i/${field.image.endpoint}/${encodeURIComponent(
      field.image.name
    )}`;

    image = (
      <img
        src={src}
        ref={imageRef}
        alt=""
        crossOrigin="anonymous"
        className={clsx("amp-preview-canvas__image", {
          "amp-preview-canvas__image--hide": !loaded,
        })}
        onLoad={() => {
          imageLoaded();
        }}
      />
    );
  }

  useEffect(() => {
    setLoaded(false);
  }, [src]);

  return (
    <div className="amp-preview-canvas">
      {image || false}
      {image && !loaded && <CircularProgress />}
      {canvas || false}
      <ModeButtons />
    </div>
  );
}
