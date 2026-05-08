import { useState } from "react";
import { CommonInput } from "../../comp/Input";
import type { ModalComp } from "../../Util/Type";

export default function CommonPop({ onClose, param, pgmId }: ModalComp) {
  if (Object.keys(param).length === 0 || !param["classCode"]) {
    onClose();
    return null;
  }
  const classCode = param["classCode"];
  const codeName = param["codeName"];

  const [txt, setTxt] = useState(codeName);

  return (
    <div>
      <CommonInput id="txt" value={txt} onChange={(v) => setTxt(v)} />
    </div>
  );
}
