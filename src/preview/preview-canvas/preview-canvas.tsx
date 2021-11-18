import "./preview-canvas.css";
import clsx from 'clsx';
import { useEffect, useState } from "react";
import { useExtensionContext } from "../../core/ExtensionContext";
import { ModeButtons } from "../mode-buttons/mode-buttons";
import { CircularProgress } from "@mui/material";

export function PreviewCanvas() {
  const { sdk, field } = useExtensionContext();
  const [loaded, setLoaded] = useState(false)

  let image: JSX.Element | undefined;
  let src = 'invalid';
  if (field && field.image.id) {
    const imageHost = sdk?.stagingEnvironment || field.image.defaultHost;
    src = `https://${imageHost}/i/${
      field.image.endpoint
    }/${encodeURIComponent(field.image.name)}`;

    image = (
      <img
        src={src}
        alt=""
        crossOrigin="anonymous"
        className={clsx('amp-preview-canvas__image', {'amp-preview-canvas__image--hide': !loaded})}
        onLoad={() => { setLoaded(true) }}
      />
    );
  }

  useEffect(() => {
    setLoaded(false);
  }, [src])

  return (
    <div className="amp-preview-canvas">
      {image}
      {image && !loaded && <CircularProgress />}
      <ModeButtons />
    </div>
  );
}
