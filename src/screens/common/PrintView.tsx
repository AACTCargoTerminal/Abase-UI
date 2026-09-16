import { useState } from "react";
import type { ModalComp } from "../../Util/Type";
import { base64ToPdfUrl } from "../../Util/Util";

export default function PrintView({
  onClose,
  param,
  pgmId,
  headerAction,
}: ModalComp) {
  if (!param["files"]) {
    onClose?.();
    return null;
  }

  const [index, setIndex] = useState(0);

  const files: any[] = param["files"] ?? [];
  const file = files[index];
  return (
    <div className="w-full h-[48rem] flex flex-col">
      {files.length !== 1 && (
        <div className="relative flex items-center justify-center py-1 bg-gray-50 border-b border-gray-200">
          {file?.["subject"] && (
            <div
              className="
      absolute left-2
      flex items-center
      w-[280px] h-9
      px-3
      bg-white
      border border-gray-200
      rounded-lg
      shadow-sm
    ">
              {/* 포인트 */}
              <div className="w-1 h-4 bg-blue-500 rounded-full mr-2 shrink-0" />

              <span
                className="
        text-sm font-medium text-gray-700
        truncate
      "
                title={file?.["subject"] || ""}>
                {file?.["subject"] || "제목 없음"}
              </span>
            </div>
          )}

          {/* 가운데 */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg shadow-sm px-1 py-0.5">
            <button
              disabled={index === 0}
              onClick={() => setIndex(index - 1)}
              className="
              px-3 py-1.5
              text-sm font-medium
              rounded-md
              text-gray-600
              hover:bg-gray-100
              disabled:text-gray-300
              disabled:hover:bg-transparent
              disabled:cursor-not-allowed
              transition-colors
              cursor-pointer
            ">
              ‹ 이전
            </button>

            <div className="px-4 text-sm font-medium text-gray-700 border-x border-gray-200">
              <span className="text-blue-600 font-semibold">{index + 1}</span>
              <span className="mx-1 text-gray-400">/</span>
              <span>{files.length}</span>
            </div>

            <button
              disabled={index === files.length - 1}
              onClick={() => setIndex(index + 1)}
              className="
              px-3 py-1.5
              text-sm font-medium
              rounded-md
              text-gray-600
              hover:bg-gray-100
              disabled:text-gray-300
              disabled:hover:bg-transparent
              disabled:cursor-not-allowed
              transition-colors
              cursor-pointer
            ">
              다음 ›
            </button>
          </div>
        </div>
      )}

      <div className="flex-1">
        {file?.type === "PDF" ? (
          <iframe
            title={`file-${index}`}
            className="w-full h-full"
            src={file.data}
          />
        ) : (
          <img
            className="w-full h-full object-contain"
            src={file?.data}
            alt=""
          />
        )}
      </div>
    </div>
  );
}
