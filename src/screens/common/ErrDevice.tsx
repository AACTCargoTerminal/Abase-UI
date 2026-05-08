import type { DeviceType } from "../../Util/Type";

export default function ErrDevice({ device }: { device: DeviceType }) {
  return (
    <div className="w-full h-full flex items-center justify-center text-lg font-bold">
      {device === "MOBILE" ? "모바일" : "PC"} 접속 불가
    </div>
  );
}
