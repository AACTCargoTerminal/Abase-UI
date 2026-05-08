import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../slices/store";
import { ModalCust } from "../../comp/Common";
import { pushModalFlag } from "../../slices/user";
import {
  MODAL_BTN_MAP,
  MODAL_ROUTE_MAP,
  MODAL_SIZE_MAP,
  type ModalRouteKey,
} from "../../route";
import type { BtnType, DeviceType, TableRow } from "../../Util/Type";
import { useEffect, useRef, useState } from "react";
import { Btn } from "../../comp/Btn";

function isRouteKey(k: string): k is ModalRouteKey {
  return k in MODAL_ROUTE_MAP;
}

function isBtnKey(k: string): k is ModalRouteKey {
  return k in MODAL_BTN_MAP;
}
export default function Modal({
  outParam,
  deviceType,
}: {
  outParam?: (r: TableRow) => void;
  deviceType: DeviceType;
}) {
  const dispatch = useDispatch();
  const modal = useSelector((state: RootState) => state.user.modalRoute);
  const [selectNod, setSelectNod] = useState(0);
  const sendRef = useRef<TableRow | null>(null);
  const closeRef = useRef<TableRow | null>(null);

  const btnArray = modal.modalRoute?.reduce<Record<number, BtnType[]>>(
    (acc, rt, i) => {
      acc[i] = isBtnKey(rt.PROGRAM_ID) ? MODAL_BTN_MAP[rt.PROGRAM_ID] : [];
      return acc;
    },
    {},
  );

  useEffect(() => {
    if (!modal.flag) {
      sendRef.current = null;
    }
  }, [modal.flag]);

  return (
    <ModalCust
      open={modal.flag}
      onClose={() => {
        dispatch(pushModalFlag(false));
        setSelectNod(0);
      }}
      deviceType={deviceType}
      title={
        modal.modalRoute?.find((_, i) => i === selectNod)?.PROGRAM_NAME || ""
      }
      size={
        modal.modalRoute && isRouteKey(modal.modalRoute[selectNod].PROGRAM_ID)
          ? MODAL_SIZE_MAP[modal.modalRoute[selectNod].PROGRAM_ID]
          : "lg"
      }
      childrenTitle={
        btnArray?.[selectNod] !== undefined
          ? {
              [selectNod]: btnArray?.[selectNod].map((item) => (
                <Btn
                  onClick={() => {
                    item.onClick?.();
                    if (
                      item.actionType === "ALL" ||
                      item.actionType === "PAGE"
                    ) {
                      outParam?.({
                        [item.txt]:
                          modal.modalRoute?.[selectNod].PROGRAM_ID || "",
                      });
                    }
                  }}
                  txt={item.txt}
                  type={item.type}
                  actionType={item.actionType}
                />
              )),
            }
          : undefined
      }
      selectNod={selectNod}
      setSelectNod={(v) => setSelectNod(v)}>
      {modal.modalRoute?.map((item, i) => {
        const Comp = isRouteKey(item.PROGRAM_ID)
          ? MODAL_ROUTE_MAP[item.PROGRAM_ID]
          : null;
        if (!Comp) {
          return null;
        }
        var params = item.param;
        if (sendRef.current !== null) {
          params = { ...item.param, ...sendRef.current };
        }
        return (
          <Comp
            onClose={() => {
              dispatch(pushModalFlag(false));
              setSelectNod(0);
              if (closeRef.current) {
                outParam?.(closeRef.current);
                closeRef.current = null;
              }
            }}
            param={params || {}}
            pgmId={item.PROGRAM_ID}
            sendParam={(r) => {
              sendRef.current = r;
              setSelectNod(i + 1);
            }}
            outParam={(r) => {
              outParam?.(r);
            }}
            closeParam={(r) => {
              closeRef.current = r;
            }}
          />
        );
      })}
    </ModalCust>
  );
}
