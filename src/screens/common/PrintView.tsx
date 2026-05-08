import type { ModalComp } from "../../Util/Type";
import { base64ToPdfUrl } from "../../Util/Util";

export default function PrintView({
  onClose,
  param,
  pgmId,
  headerAction,
}: ModalComp) {
  if (!param["data"] && !param["type"]) {
    return null;
  }
  return (
    <div className="w-full h-[45rem]">
      {param["type"] === "PDF" ? (
        <iframe className="w-full h-full" src={param["data"]} />
      ) : (
        <img className="w-full h-full" src={param["data"]} />
      )}
    </div>
  );
}
