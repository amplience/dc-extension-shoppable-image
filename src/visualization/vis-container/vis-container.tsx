import "./vis-container.css";
import { Checkbox, FormControlLabel, FormGroup } from "@mui/material";
import { useState } from "react";
import { VisPage } from "../vis-page/vis-page";

export function VisContainer({ vse }: { vse: string }) {
  const [hotspotHide, setHotspotHide] = useState(false);
  const [scaleToFit, setScaleToFit] = useState(false);

  return (
    <>
      <div className="amp-vis-container-toolbar">
        <FormGroup className="amp-vis-container-toolbar__group">
          <FormControlLabel
            control={
              <Checkbox
                checked={hotspotHide}
                onChange={(evt) => setHotspotHide(evt.target.checked)}
              />
            }
            label="Hide Hotspots"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={scaleToFit}
                onChange={(evt) => setScaleToFit(evt.target.checked)}
              />
            }
            label="Scale to Fit"
          />
        </FormGroup>
      </div>
      <VisPage hotspotHide={hotspotHide} scaleToFit={scaleToFit} vse={vse} />
    </>
  );
}
