import "./title.css";
import { useExtensionContext } from "../../core/ExtensionContext";

export function Title() {
  const { params } = useExtensionContext();
  const title = params?.title;

  return title != null ? (
    <div className="amp-title">{title}</div>
  ) : (
    <></>
  );
}
