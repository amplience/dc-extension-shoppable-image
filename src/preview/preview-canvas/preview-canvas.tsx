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
  ShoppableImagePoint,
  ShoppableImagePolygon,
} from "../../core/ShoppableImageData";
import { MouseState } from "./mouse-state";
import {
  EditorMode,
  MetadataSelectionType,
  useEditorContext,
} from "../../core/EditorContext";
import { pointsToSVGPath, Polygon, SVGPath } from "../polygon/polygon";
import { PolygonHelper } from "../polygon/polygon-helper";
import { useWindowContext } from "../../core/WindowContext";
import { v4 as uuidv4 } from 'uuid';

export function PreviewCanvas() {
  const { mode, selection, setSelection } = useEditorContext();
  const { sdk, field, setField, setUndo } = useExtensionContext();
  const windowSize = useWindowContext();
  const [loaded, setLoaded] = useState(false);
  const [cursor, setCursor] = useState("default");
  const [imageSize, setImageSize] = useState({ w: -1, h: -1 });
  const [grabOffset, setGrabOffset] = useState({ x: 0, y: 0 });
  const [mouseState] = useState(new MouseState());

  const imageRef = React.createRef<HTMLImageElement>();
  const canvasRef = React.createRef<HTMLDivElement>();

  const targetHeight = 458;
  const targetWidth = windowSize.w;
  const targetAspect = targetWidth / targetHeight;

  let polygons: SVGPath[] = [];

  const imageLoaded = () => {
    setLoaded(true);
    if (imageRef.current) {
      setImageSize({ w: imageRef.current.width, h: imageRef.current.height });
    }
  };

  let imageStyle: any = {};
  let canvas: JSX.Element | undefined;
  if (loaded) {
    const widthBounded = imageSize.w / imageSize.h > targetAspect;

    const canvasHeight = widthBounded
      ? (imageSize.h / imageSize.w) * targetWidth
      : targetHeight;
    const canvasWidth = widthBounded
      ? targetWidth
      : (imageSize.w / imageSize.h) * targetHeight;

    imageStyle = widthBounded ? { minWidth: '100%' } : { minHeight: '100%' };

    const unitScale = widthBounded ? targetHeight / targetWidth : 1;

    const aspect = {
      x: unitScale * (widthBounded ? 1 : canvasHeight / canvasWidth),
      y: unitScale * (widthBounded ? canvasWidth / canvasHeight : 1),
    };

    const size = { x: canvasWidth, y: canvasHeight };

    if (field && field.polygons) {
      polygons = field.polygons.map((polygon) =>
        pointsToSVGPath(polygon.points)
      );
    }

    const scaleSize = (poi: ShoppableImagePoi): any => {
      return {
        transform: `translate(${poi.x * canvasWidth}px, ${
          poi.y * canvasHeight
        }px)`,
        width: poi.w * canvasWidth + "px",
        height: poi.h * canvasHeight + "px",
      };
    };

    const scaleHotspot = (hotspot: ShoppableImageHotspot): any => {
      return {
        transform: `translate(${hotspot.points.x * canvasWidth}px, ${
          hotspot.points.y * canvasHeight
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

    const getClickedPolygon = (
      x: number,
      y: number
    ): [ShoppableImagePolygon | undefined, MetadataSelectionType] => {
      // Step 1: Find the polygon with the lowest distance.
      // This is used to select polygons when the mouse overlaps multiple.

      let bestIndex = -1;
      let bestDistanceSquared = Infinity;
      let bestType = MetadataSelectionType.Default;

      const resizeMarginX = 0.01 * aspect.x;
      const resizeMarginY = 0.01 * aspect.y;

      let index = 0;
      if (field && field.polygons) {
        for (const polygon of polygons) {
          // First, does the polygon overlap the mouse?
          const bounds = polygon.bounds;
          const endX = bounds.x + bounds.w + resizeMarginX;
          const endY = bounds.y + bounds.h + resizeMarginY;
          if (x >= bounds.x && y >= bounds.y && x <= endX && y <= endY) {
            let type = MetadataSelectionType.Default;

            if (x > bounds.x + bounds.w - resizeMarginX) {
              type = MetadataSelectionType.ResizeX;
            }

            if (y > bounds.y + bounds.h - resizeMarginY) {
              type =
                type === MetadataSelectionType.ResizeX
                  ? MetadataSelectionType.Resize
                  : MetadataSelectionType.ResizeY;
            }

            const center = {
              x: bounds.x + bounds.w / 2,
              y: bounds.y + bounds.h / 2,
            };

            const dV = [
              Math.abs(x - center.x) / aspect.x,
              Math.abs(y - center.y) / aspect.y,
            ];

            const distSquared =
              selection && selection.target === field.polygons[index]
                ? 0
                : dV[0] * dV[0] + dV[1] * dV[1];

            if (distSquared < bestDistanceSquared) {
              bestIndex = index;
              bestDistanceSquared = distSquared;
              bestType = type;
            }
          }

          index++;
        }
      }

      if (field && field.polygons && bestIndex != null) {
        return [field.polygons[bestIndex], bestType];
      } else {
        return [undefined, MetadataSelectionType.Default];
      }
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

          const dV = [
            (Math.abs(x - point.x) / aspect.x),
            (Math.abs(y - point.y) / aspect.y),
          ];
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
        const y = (evt.pageY - offset.y) / canvasHeight;

        const markUndo = (condition: boolean | undefined) => {
          if (condition && selection && setUndo && !selection.createdUndo) {
            setUndo();
            selection.createdUndo = true;
          }
        };

        switch (mode) {
          case EditorMode.EditorPoi:
            const width = 0.15 * aspect.x;
            const height = 0.15 * aspect.y;

            const poi = boundPoi({
              x: x - width / 2,
              y: y - height / 2,
              w: width,
              h: height,
            });

            field.poi = poi;
            break;
          case EditorMode.EditorHotspot:
            if (selection) {
              const points = {
                x: x + grabOffset.x,
                y: y + grabOffset.y,
              };

              const oldPoints = (selection.target as ShoppableImageHotspot)
                .points;

              markUndo(oldPoints.x !== points.x || oldPoints.y !== points.y);

              (selection.target as ShoppableImageHotspot).points = points;
            }
            break;
          case EditorMode.EditorPolygonRect:
          case EditorMode.EditorPolygonCircle:
            if (selection && field.polygons) {
              const polygon = selection.target as ShoppableImagePolygon;
              const polyIndex = field.polygons.indexOf(polygon);
              const cPoly = polygons[polyIndex];

              if (selection.lastPosition) {
                const offset = {
                  x: x - selection.lastPosition.x,
                  y: y - selection.lastPosition.y,
                };

                if (selection.type === MetadataSelectionType.Default) {
                  markUndo(offset.x !== 0 || offset.y !== 0);

                  polygon.points = polygon.points.map((point) => {
                    return {
                      x: point.x + offset.x,
                      y: point.y + offset.y,
                    };
                  });
                } else {
                  const resizeBoth =
                    selection.type === MetadataSelectionType.Resize;
                  const resizeX =
                    resizeBoth ||
                    selection.type === MetadataSelectionType.ResizeX;
                  const resizeY =
                    resizeBoth ||
                    selection.type === MetadataSelectionType.ResizeY;

                  const minWidth = 0.05 * aspect.x;
                  const minHeight = 0.05 * aspect.y;

                  const newWidth = Math.max(
                    minWidth,
                    resizeX ? x - cPoly.bounds.x : cPoly.bounds.w
                  );

                  const newHeight = Math.max(
                    minHeight,
                    resizeY ? y - cPoly.bounds.y : cPoly.bounds.h
                  );

                  const ratioX = newWidth / cPoly.bounds.w;
                  const ratioY = newHeight / cPoly.bounds.h;

                  markUndo(ratioX !== 1 || ratioY !== 1);

                  polygon.points = polygon.points.map((point) => {
                    return {
                      x: (point.x - cPoly.bounds.x) * ratioX + cPoly.bounds.x,
                      y: (point.y - cPoly.bounds.y) * ratioY + cPoly.bounds.y,
                    };
                  });
                }
              }

              selection.lastPosition = { x, y };
            }
            break;
        }

        setField();
      }
    };

    const mouseMove = (evt: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      let targetMouse = "default";

      if (mouseState.isMouseDown) {
        if (
          selection &&
          selection.target &&
          selection.type === MetadataSelectionType.Default
        ) {
          targetMouse = "grabbing";
        }

        onDrag(evt);
      } else if (canvasRef.current) {
        const offset = getPageOffset(canvasRef.current);
        const x = (evt.pageX - offset.x) / canvasWidth;
        const y = (evt.pageY - offset.y) / canvasHeight;

        if (
          mode === EditorMode.EditorPolygonCircle ||
          mode === EditorMode.EditorPolygonRect
        ) {
          const [hover, mode] = getClickedPolygon(x, y);

          if (hover) {
            switch (mode) {
              case MetadataSelectionType.Default:
                targetMouse = "grab";
                break;
              case MetadataSelectionType.ResizeX:
                targetMouse = "ew-resize";
                break;
              case MetadataSelectionType.ResizeY:
                targetMouse = "ns-resize";
                break;
              case MetadataSelectionType.Resize:
                targetMouse = "nwse-resize";
                break;
            }
          } else {
            targetMouse = "copy";
          }
        } else if (mode === EditorMode.EditorHotspot) {
          const hover = getClickedHotspot(x, y);
          if (hover) {
            targetMouse = "grab";
          }
        }
      }

      if (cursor !== targetMouse) {
        setCursor(targetMouse);
      }
    };

    const mouseDown = (evt: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      mouseState.mouseDown();
      if (canvasRef.current && field) {
        const offset = getPageOffset(canvasRef.current);
        const x = (evt.pageX - offset.x) / canvasWidth;
        const y = (evt.pageY - offset.y) / canvasHeight;

        switch (mode) {
          case EditorMode.EditorPoi:
            // POI does not need selection.
            if (setUndo) setUndo();
            break;
          case EditorMode.EditorHotspot:
            if (!field.hotspots) {
              field.hotspots = [];
            }

            let moveHotspot = getClickedHotspot(x, y);
            const isNew = !moveHotspot;

            if (!moveHotspot) {
              moveHotspot = {
                id: uuidv4(),
                target: "target",
                selector: ".selector",
                points: {
                  x,
                  y,
                },
              };

              if (setUndo) setUndo();
              field.hotspots.push(moveHotspot);
            }

            setGrabOffset({
              x: moveHotspot.points.x - x,
              y: moveHotspot.points.y - y,
            });
            setSelection({
              target: moveHotspot,
              type: MetadataSelectionType.Default,
              createdUndo: isNew,
            });
            break;

          case EditorMode.EditorPolygonCircle:
          case EditorMode.EditorPolygonRect:
            if (!field.polygons) {
              field.polygons = [];
            }

            let [movePolygon, type] = getClickedPolygon(x, y);
            const isPolyNew = !movePolygon;

            if (!movePolygon) {
              let points: ShoppableImagePoint[];
              if (mode === EditorMode.EditorPolygonRect) {
                points = PolygonHelper.box(
                  x,
                  y,
                  0.1 * aspect.x,
                  0.1 * aspect.y
                );
              } else {
                points = PolygonHelper.circle(
                  x,
                  y,
                  0.1 * aspect.x,
                  0.1 * aspect.y
                );
              }

              movePolygon = {
                id: uuidv4(),
                target: "target",
                selector: ".selector",
                points: points,
              };

              if (setUndo) setUndo();
              field.polygons.push(movePolygon);

              type = MetadataSelectionType.Resize;
            }

            setGrabOffset({
              x: x,
              y: y,
            });

            setSelection({
              target: movePolygon,
              type: type,
              lastPosition: { x, y },
              createdUndo: isPolyNew,
            });
            break;
        }
      }
    };

    const mouseUp = (evt: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      mouseState.mouseUp();
      mouseMove(evt);
    };

    canvas = (
      <div
        className="amp-preview-canvas__interactive"
        style={{
          width: canvasWidth + "px",
          height: canvasHeight + "px",
          cursor,
        }}
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
                "amp-preview-canvas__hotspot--selected":
                  selection && selection.target === hotspot,
                "amp-preview-canvas__hotspot--inactive":
                  mode !== EditorMode.EditorHotspot,
              })}
              style={scaleHotspot(hotspot)}
            ></div>
          ))}

        {field &&
          field.polygons &&
          polygons.map((polygon, index) => (
            <Polygon
              key={index}
              size={size}
              className={clsx("amp-preview-canvas__polygon", {
                "amp-preview-canvas__polygon--selected":
                  selection &&
                  selection.target ===
                    (field.polygons as ShoppableImagePolygon[])[index],
                "amp-preview-canvas__polygon--inactive":
                  mode !== EditorMode.EditorPolygonRect &&
                  mode !== EditorMode.EditorPolygonCircle,
              })}
              polygon={polygon}
            ></Polygon>
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
        style={imageStyle}
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
