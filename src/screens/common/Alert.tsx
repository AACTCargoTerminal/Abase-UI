import { useSelector } from "react-redux";
import type { RootState } from "../../slices/store";
import { useEffect, useRef, useState } from "react";
import { FaBell } from "react-icons/fa";
import { ErrorRow } from "../../comp/Common";
import { MdErrorOutline } from "react-icons/md";

export default function Alert() {
  const err = useSelector((state: RootState) => state.err.orgQue);
  const [errArr, setErrArr] = useState(err);
  const [flag, setFlag] = useState(false);
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);
  useEffect(() => {
    if (errArr.length < err.length) {
      setFlag(true);
    }
    setErrArr(err);
  }, [err]);
  return (
    <div
      onMouseEnter={() => {
        if (closeTimer.current) {
          clearTimeout(closeTimer.current);
          closeTimer.current = null;
        }
        setOpen(true);
      }}
      onMouseLeave={() =>
        (closeTimer.current = window.setTimeout(() => setOpen(false), 120))
      }>
      <div
        className={`${
          flag ? "text-[#F23142]" : "text-white"
        } size-[2rem] rounded-full cursor-pointer hover:bg-gray-300 p-[0.3rem]`}
        onMouseEnter={() => setFlag(false)}>
        <FaBell className="size-full" />
      </div>
      <div
        className={[
          "fixed right-4 w-[30vw] mt-[1rem]",
          "rounded-md z-[9999]",
          "transition-all duration-200 ease-out origin-top transform",
          open
            ? "opacity-100 scale-y-100 pointer-events-auto"
            : "opacity-0 scale-y-95 pointer-events-none",
        ].join(" ")}
        onMouseEnter={() => {
          if (closeTimer.current) {
            clearTimeout(closeTimer.current);
            closeTimer.current = null;
          }
          setOpen(true);
        }}
        onMouseLeave={() =>
          (closeTimer.current = window.setTimeout(() => setOpen(false), 120))
        }>
        <div className="flex-col space-y-2">
          {errArr.map((obj) => (
            <div
              key={obj.id}
              id={obj.id}
              className={`bg-[#FDEDED] rounded px-4 py-2 flex w-full items-center duration-300`}>
              <MdErrorOutline className="flex-shrink-0 text-[#ED1C24] text-2xl mr-2" />
              <pre className="contTitle whitespace-pre-wrap break-words">
                {obj.errMsg}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
