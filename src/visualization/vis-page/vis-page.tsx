import "./vis-page.css";
import { CircularProgress, Tooltip } from "@mui/material";
import clsx from "clsx";
import React from "react";
import { useEffect, useState } from "react";
import {
  ShoppableImageHotspot,
  ShoppableImagePoi,
  ShoppableImagePolygon,
} from "../../core/ShoppableImageData";
import {
  pointsToSVGPath,
  PolygonForwardRef,
  SVGPath,
} from "../../preview/polygon/polygon";
import { useVisualizationContext } from "../visualization-context";
import { useWindowContext } from "../../core/WindowContext";

export function VisPage({ vse, hotspotHide }: { vse: string, hotspotHide: boolean }) {
  const { field } = useVisualizationContext();
  const windowSize = useWindowContext();
  const [loaded, setLoaded] = useState(false);
  const [imageSize, setImageSize] = useState({ w: -1, h: -1 });
  const toolbarHeight = 42;

  const targetWidth = windowSize.w;
  const targetHeight = windowSize.h - toolbarHeight;

  const imageRef = React.createRef<HTMLImageElement>();
  const canvasRef = React.createRef<HTMLDivElement>();

  const targetAspect = targetWidth / targetHeight;

  let polygons: SVGPath[] = [];

  const imageLoaded = () => {
    setLoaded(true);
    if (imageRef.current) {
      setImageSize({ w: imageRef.current.width, h: imageRef.current.height });
    }
  };

  const hotspotTitle = (hotspot: ShoppableImageHotspot | ShoppableImagePolygon) => {
    return `Target: ${hotspot.target} | Selector: ${hotspot.selector}`;
  };

  if (field && field.polygons) {
    polygons = field.polygons.map((polygon) => pointsToSVGPath(polygon.points));
  }

  let imageStyle: any = {};
  let canvas: JSX.Element | undefined;
  const hidden = hotspotHide;

  if (field && loaded) {
    const widthBounded = imageSize.w / imageSize.h > targetAspect;

    const canvasHeight = widthBounded
      ? (imageSize.h / imageSize.w) * targetWidth
      : targetHeight;
    const canvasWidth = widthBounded
      ? targetWidth
      : (imageSize.w / imageSize.h) * targetHeight;

    imageStyle = widthBounded ? { minWidth: "100%" } : { minHeight: "100%" };

    const size = { x: canvasWidth, y: canvasHeight };

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

    canvas = (
      <div
        className="amp-vis-page__interactive"
        style={{
          width: canvasWidth + "px",
          height: canvasHeight + "px",
        }}
        ref={canvasRef}
      >
        {field && field.poi && field.poi.x != null && (
          <div
            className={clsx("amp-vis-page__focalpoint", {
              "amp-vis-page__focalpoint--hidden": hidden,
            })}
            style={scaleSize(field.poi)}
          >
            <div className="amp-vis-page__focalcircle"></div>
          </div>
        )}

        {field &&
          field.polygons &&
          polygons.map((polygon, index) => (
            <Tooltip
              key={index}
              title={hotspotTitle(
                (field.polygons as ShoppableImagePolygon[])[index]
              )}
              followCursor
            >
              <PolygonForwardRef
                size={size}
                className={clsx("amp-vis-page__polygon", {
                  "amp-vis-page__polygon--hidden": hidden,
                })}
                polygon={polygon}
              ></PolygonForwardRef>
            </Tooltip>
          ))}

        {field &&
          field.hotspots &&
          field.hotspots.map((hotspot, index) => (
            <Tooltip key={index} title={hotspotTitle(hotspot)} followCursor>
              <div
                className={clsx("amp-vis-page__hotspot", {
                  "amp-vis-page__hotspot--hidden": hidden,
                })}
                style={scaleHotspot(hotspot)}
              ></div>
            </Tooltip>
          ))}
      </div>
    );
  }

  let image: JSX.Element | undefined;
  let src = "invalid";
  if (field && field.image.id) {
    const imageHost = vse || field.image.defaultHost;
    src = `https://${imageHost}/i/${field.image.endpoint}/${encodeURIComponent(
      field.image.name
    )}`;

    image = (
      <img
        src={src}
        ref={imageRef}
        alt=""
        crossOrigin="anonymous"
        className={clsx("amp-vis-page__image", {
          "amp-vis-page__image--hide": !loaded,
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
    <div className="amp-vis-page" style={{ height: targetHeight }}>
      {image || false}
      {image && !loaded && <CircularProgress />}
      {canvas || false}
    </div>
  );
}
