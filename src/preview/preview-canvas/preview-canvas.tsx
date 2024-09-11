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
  MetadataSelectionMode,
  MetadataSelectionTarget,
  MetadataSelectionType,
  useEditorContext,
} from "../../core/EditorContext";
import { pointsToSVGPath, Polygon, SVGPath } from "../polygon/polygon";
import { PolygonHelper } from "../polygon/polygon-helper";
import { useWindowContext } from "../../core/WindowContext";
import { v4 as uuidv4 } from "uuid";

export function PreviewCanvas() {
  const { mode, selection, setSelection, setAspect } = useEditorContext();
  const { sdk, field, setField, setUndo, thumbURL, assetVersion } =
    useExtensionContext();
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

  let aspect = { x: 1, y: 1 };

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

    imageStyle = widthBounded ? { minWidth: "100%" } : { minHeight: "100%" };

    const unitScale = widthBounded ? targetHeight / targetWidth : 1;

    aspect = {
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
      const rect = elem.getBoundingClientRect();

      return {
        x: rect.x,
        y: rect.y,
      };
    };

    const boundPoi = (poi: ShoppableImagePoi): ShoppableImagePoi => {
      if (poi.x < 0) poi.x = 0;
      if (poi.y < 0) poi.y = 0;
      if (poi.x + poi.w > 1) poi.x = 1 - poi.w;
      if (poi.y + poi.h > 1) poi.y = 1 - poi.h;

      return poi;
    };

    const isHotPolyMode = (): boolean => {
      return (
        mode === EditorMode.EditorPolygonRect ||
        mode === EditorMode.EditorPolygonCircle ||
        mode === EditorMode.EditorHotspot ||
        mode === EditorMode.EditorGrab
      );
    };

    type ResizeAnchor = { x: number; y: number };

    interface ClickedPolygonResult {
      polygon?: ShoppableImagePolygon | undefined;
      type: MetadataSelectionType;
      anchor?: ResizeAnchor;
      bestDistanceSquared: number;
    }

    const getClickedPolygon = (x: number, y: number): ClickedPolygonResult => {
      // Step 1: Find the polygon with the lowest distance.
      // This is used to select polygons when the mouse overlaps multiple.

      let bestIndex = -1;
      let bestDistanceSquared = Infinity;
      let bestType = MetadataSelectionType.Default;
      let anchor: ResizeAnchor | undefined;

      const resizeMarginX = 0.01 * aspect.x;
      const resizeMarginY = 0.01 * aspect.y;

      let index = 0;
      if (field && field.polygons) {
        for (const polygon of polygons) {
          // First, does the polygon overlap the mouse?
          const bounds = polygon.bounds;
          const startX = bounds.x - resizeMarginX;
          const startY = bounds.y - resizeMarginY;
          const endX = bounds.x + bounds.w + resizeMarginX;
          const endY = bounds.y + bounds.h + resizeMarginY;
          if (x >= startX && y >= startY && x <= endX && y <= endY) {
            let type = MetadataSelectionType.Default;

            // 1 indicates positive resize, 0 negative.
            let resizeX: number | undefined;
            let resizeY: number | undefined;

            if (x > bounds.x + bounds.w - resizeMarginX) {
              resizeX = 1;
            } else if (x < bounds.x + resizeMarginX) {
              resizeX = 0;
            }

            if (y > bounds.y + bounds.h - resizeMarginY) {
              resizeY = 1;
            } else if (y < bounds.y + resizeMarginY) {
              resizeY = 0;
            }

            if (resizeX !== undefined) {
              type =
                resizeY !== undefined
                  ? MetadataSelectionType.Resize
                  : MetadataSelectionType.ResizeX;

              // 0 indicates anchor at x,y. 1 indicates anchor at width,height.
              anchor = { x: 1 - resizeX, y: 1 - (resizeY || 0) };
            } else if (resizeY !== undefined) {
              type = MetadataSelectionType.ResizeY;

              anchor = { x: 0, y: 1 - resizeY };
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
        return {
          polygon: field.polygons[bestIndex],
          type: bestType,
          anchor,
          bestDistanceSquared,
        };
      } else {
        return {
          polygon: undefined,
          type: MetadataSelectionType.Default,
          anchor,
          bestDistanceSquared,
        };
      }
    };

    const getClickedHotspot = (
      x: number,
      y: number,
      bestDistanceSquared = Infinity
    ): ShoppableImageHotspot | undefined => {
      // Step 1: Find the hotspot with the lowest distance.

      let bestHotspot: ShoppableImageHotspot | undefined;

      if (field && field.hotspots) {
        for (const hotspot of field.hotspots) {
          const point = hotspot.points;

          const dV = [
            Math.abs(x - point.x) / aspect.x,
            Math.abs(y - point.y) / aspect.y,
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

          case EditorMode.EditorGrab:
          case EditorMode.EditorHotspot:
          case EditorMode.EditorPolygonRect:
          case EditorMode.EditorPolygonCircle:
            if (selection) {
              switch (selection.mode) {
                case MetadataSelectionMode.Hotspot:
                  const points = {
                    x: x + grabOffset.x,
                    y: y + grabOffset.y,
                  };

                  const oldPoints = (selection.target as ShoppableImageHotspot)
                    .points;

                  markUndo(
                    oldPoints.x !== points.x || oldPoints.y !== points.y
                  );

                  (selection.target as ShoppableImageHotspot).points = points;
                  break;
                case MetadataSelectionMode.Polygon:
                  if (field.polygons) {
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

                        const anchor = selection.resizeAnchor;

                        const anchorEdgeX =
                          cPoly.bounds.x + (anchor?.x || 0) * cPoly.bounds.w;
                        const anchorEdgeY =
                          cPoly.bounds.y + (anchor?.y || 0) * cPoly.bounds.h;

                        // The distance from mouse is flipped with the anchor at bottom right.
                        const mulX = ((anchor?.x || 0) - 0.5) * -2;
                        const mulY = ((anchor?.y || 0) - 0.5) * -2;

                        const newWidth = Math.max(
                          minWidth,
                          resizeX ? (x - anchorEdgeX) * mulX : cPoly.bounds.w
                        );

                        const newHeight = Math.max(
                          minHeight,
                          resizeY ? (y - anchorEdgeY) * mulY : cPoly.bounds.h
                        );

                        const ratioX = newWidth / cPoly.bounds.w;
                        const ratioY = newHeight / cPoly.bounds.h;

                        let offset: { x: number; y: number };
                        if (selection.resizeAnchor) {
                          offset = {
                            x:
                              (cPoly.bounds.w - newWidth) *
                              selection.resizeAnchor.x,
                            y:
                              (cPoly.bounds.h - newHeight) *
                              selection.resizeAnchor.y,
                          };
                        } else {
                          offset = { x: 0, y: 0 };
                        }

                        markUndo(ratioX !== 1 || ratioY !== 1);

                        polygon.points = polygon.points.map((point) => {
                          return {
                            x:
                              (point.x - cPoly.bounds.x) * ratioX +
                              cPoly.bounds.x +
                              offset.x,
                            y:
                              (point.y - cPoly.bounds.y) * ratioY +
                              cPoly.bounds.y +
                              offset.y,
                          };
                        });
                      }
                    }

                    selection.lastPosition = { x, y };
                  }
                  break;
              }
            }
            break;
        }

        setField();
      }
    };

    const getMouseType = (
      type: MetadataSelectionType,
      anchor?: ResizeAnchor
    ): string => {
      switch (type) {
        case MetadataSelectionType.Default:
          return "grab";
        case MetadataSelectionType.ResizeX:
          return "ew-resize";
        case MetadataSelectionType.ResizeY:
          return "ns-resize";
        case MetadataSelectionType.Resize:
          return anchor && anchor.x !== anchor.y
            ? "nesw-resize"
            : "nwse-resize";
      }
      return "default";
    };

    const mouseMove = (evt: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      let targetMouse = "default";

      if (mouseState.isMouseDown) {
        if (selection && selection.target) {
          if (selection.type === MetadataSelectionType.Default) {
            targetMouse = "grabbing";
          } else {
            targetMouse = getMouseType(selection.type, selection.resizeAnchor);
          }
        }

        onDrag(evt);
      } else if (canvasRef.current) {
        const offset = getPageOffset(canvasRef.current);
        const x = (evt.pageX - offset.x) / canvasWidth;
        const y = (evt.pageY - offset.y) / canvasHeight;

        if (isHotPolyMode()) {
          const { polygon, type, anchor, bestDistanceSquared } =
            getClickedPolygon(x, y);
          const hover = getClickedHotspot(x, y, bestDistanceSquared);

          if (hover) {
            targetMouse = "grab";
          } else if (polygon) {
            targetMouse = getMouseType(type, anchor);
          } else if (mode !== EditorMode.EditorGrab) {
            targetMouse = "copy";
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
            onDrag(evt);
            break;

          case EditorMode.EditorGrab:
          case EditorMode.EditorHotspot:
          case EditorMode.EditorPolygonCircle:
          case EditorMode.EditorPolygonRect:
            if (!field.polygons) {
              field.polygons = [];
            }

            if (!field.hotspots) {
              field.hotspots = [];
            }

            let target: MetadataSelectionTarget;
            let selectionMode: MetadataSelectionMode;

            let { polygon, type, anchor, bestDistanceSquared } =
              getClickedPolygon(x, y);

            let moveHotspot = getClickedHotspot(x, y, bestDistanceSquared);

            let isNew = false;

            if (moveHotspot) {
              selectionMode = MetadataSelectionMode.Hotspot;
              target = moveHotspot;
            } else if (polygon) {
              selectionMode = MetadataSelectionMode.Polygon;
              target = polygon;
            } else {
              isNew = true;

              // Didn't click a hostpot or a polygon.
              // Depeding on mode, create a new one.

              if (mode === EditorMode.EditorHotspot) {
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

                selectionMode = MetadataSelectionMode.Hotspot;
                target = moveHotspot;
              } else {
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

                polygon = {
                  id: uuidv4(),
                  target: "target",
                  selector: ".selector",
                  points: points,
                };

                if (setUndo) setUndo();
                field.polygons.push(polygon);

                type = MetadataSelectionType.Resize;

                selectionMode = MetadataSelectionMode.Polygon;
                target = polygon;
              }
            }

            if (selectionMode === MetadataSelectionMode.Hotspot) {
              setGrabOffset({
                x: (target as ShoppableImageHotspot).points.x - x,
                y: (target as ShoppableImageHotspot).points.y - y,
              });
            } else {
              setGrabOffset({
                x: x,
                y: y,
              });
            }

            setSelection({
              target,
              mode: selectionMode,
              type: type,
              lastPosition: { x, y },
              resizeAnchor: anchor,
              createdUndo: isNew,
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
              key={hotspot.id}
              className={clsx("amp-preview-canvas__hotspot", {
                "amp-preview-canvas__hotspot--selected":
                  selection && selection.target === hotspot,
                "amp-preview-canvas__hotspot--inactive": !isHotPolyMode(),
              })}
              style={scaleHotspot(hotspot)}
            >
              <svg
                viewBox="0 0 20 20"
                className={clsx("amp-preview-canvas__hotspotplus")}
              >
                <rect x="9.15" y="3.5" width="1.7" height="13"></rect>
                <rect y="9.15" x="3.5" width="13" height="1.7"></rect>
              </svg>
            </div>
          ))}

        {field &&
          field.polygons &&
          polygons.map((polygon, index) => (
            <Polygon
              key={field.polygons![index].id}
              size={size}
              className={clsx("amp-preview-canvas__polygon", {
                "amp-preview-canvas__polygon--selected":
                  selection &&
                  selection.target ===
                    (field.polygons as ShoppableImagePolygon[])[index],
                "amp-preview-canvas__polygon--inactive": !isHotPolyMode(),
              })}
              polygon={polygon}
            ></Polygon>
          ))}
      </div>
    );
  }

  let image: JSX.Element | undefined;
  let src = "invalid";
  if (field && field?.image?.id) {
    src = sdk?.stagingEnvironment
      ? `https://${sdk.stagingEnvironment}/i/${
          field.image.endpoint
        }/${encodeURIComponent(field.image.name)}?v=${assetVersion}`
      : thumbURL;

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

  useEffect(() => {
    setAspect(aspect);
  }, [loaded]);

  return (
    <div>
      <div className="amp-preview-canvas">
        {image && !loaded && (
          <div className="amp-preview-canvas-progress">
            <CircularProgress />
          </div>
        )}
        {image || false}
        {canvas || false}
        <ModeButtons />
      </div>
    </div>
  );
}
