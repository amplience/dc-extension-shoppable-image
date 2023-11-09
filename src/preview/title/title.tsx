import "./title.css";
import { useExtensionContext } from "../../core/ExtensionContext";

export function Title() {
  const { params, isField } = useExtensionContext();
  const title = params?.title;

  return title != null && isField ? (
    <div className="amp-title">{title}</div>
  ) : (
    <></>
  );
}
