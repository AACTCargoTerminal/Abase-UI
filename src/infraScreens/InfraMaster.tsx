import React from "react";
import type {
  DefComp,
  DefInfraComp,
  DeviceType,
  PageHandle,
} from "../Util/Type";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../slices/store";
import { hasKey } from "../Util/Util";
import { INFRA_ROUTE_MAP } from "../route";
import Board from "../screens/common/Board";
import Redirect from "../screens/common/Redirect";
import Modal from "../screens/common/Modal";
import ErrDevice from "../screens/common/ErrDevice";

function useStableMap<T>() {
  const ref = React.useRef<Record<string, T>>({});
  return ref;
}

const InfraMaster = ({ deviceType }: { deviceType: DeviceType }) => {
  const dispatch = useDispatch();
  const route = useSelector((state: RootState) => state.user.route);
  const routeArray = useSelector((state: RootState) => state.user.routeArray);

  const stableOutParamMap = useStableMap<(ret: any) => void>();
  const stableParamMap = useStableMap<any>();
  const outParamHandlers = React.useRef<Record<string, (payload: any) => void>>(
    {},
  );

  const activeId = route?.MENU_ID;

  const getOutParam = React.useCallback(
    (pgmId: string) => {
      if (!stableOutParamMap.current[pgmId]) {
        stableOutParamMap.current[pgmId] = (ret: any) => {
          //   if (ret["INOUT_FLAG"]) {
          //     dispatch(pushSchInout(ret["INOUT_FLAG"]));
          //   }
        };
      }
      return stableOutParamMap.current[pgmId];
    },
    [dispatch],
  );

  const registerOutParam = React.useCallback(
    (pgmId: string, fn: (payload: any) => void) => {
      outParamHandlers.current[pgmId] = fn;
    },
    [],
  );

  const emitToActive = React.useCallback(
    (payload: any) => {
      if (!activeId) return;
      outParamHandlers.current[activeId]?.(payload);
    },
    [activeId],
  );

  const unregisterOutParam = React.useCallback((pgmId: string) => {
    delete outParamHandlers.current[pgmId];
  }, []);

  return (
    <main
      className={`fixed top-[7%] ${deviceType === "PC" ? "left-[10.5%]  w-[calc(100vw-10.5vw)]" : "w-[calc(100vw)]"} h-[calc(100vh-7vh)] overflow-x-hidden overflow-y-auto`}>
      {routeArray.length > 0 ? (
        routeArray.map((r) => {
          if (r.MENU_ID === undefined) {
            return null;
          }
          const Comp = hasKey(INFRA_ROUTE_MAP, r.MENU_ID)
            ? INFRA_ROUTE_MAP[r.MENU_ID]
            : null;
          if (!Comp) return null;

          const isActive = activeId === r.MENU_ID;

          // 비활성 탭은 "처음 값"을 계속 사용 (props 고정)
          if (isActive) {
            if (r.PROGRAM_TYPE_CODE === "Mobile" && deviceType !== "MOBILE") {
              return <ErrDevice device={deviceType} />;
            } else if (
              r.PROGRAM_TYPE_CODE !== "Mobile" &&
              deviceType === "MOBILE" &&
              r.PROGRAM_TYPE_CODE !== "MOWEB"
            ) {
              return <ErrDevice device={deviceType} />;
            }
            var tmp = r.param;
            if (r.ARGUMENT) {
              const sp: string[] = r.ARGUMENT.split(";");
              if (sp.length > 0) {
                sp.forEach((v, i) => {
                  if (v.length > 0) {
                    tmp = { ...tmp, [`param${i}`]: v };
                  }
                });
              }
            }

            stableParamMap.current[r.MENU_ID] = tmp;
          }

          const paramToPass = stableParamMap.current[r.MENU_ID];
          const outParamToPass = isActive
            ? getOutParam(r.MENU_ID)
            : stableOutParamMap.current[r.MENU_ID];

          return (
            <div
              key={r.MENU_ID}
              style={{
                display: isActive ? "block" : "none",
                width: "100%",
                height: "100%",
              }}>
              <RoutePanel
                Comp={Comp}
                isActive={isActive}
                param={paramToPass}
                pgmId={r.MENU_ID || r.PROGRAM_ID}
                outParam={outParamToPass || (() => {})}
                registerOutParam={registerOutParam}
                unregisterOutParam={unregisterOutParam}
                deviceType={deviceType}
              />
            </div>
          );
        })
      ) : (
        <Board deviceType={deviceType} />
      )}

      {route &&
        !hasKey(INFRA_ROUTE_MAP, route.MENU_ID) &&
        !hasKey(INFRA_ROUTE_MAP, route.PROGRAM_ID) && <Redirect />}
      <Modal
        outParam={(r) => {
          emitToActive(r);
        }}
        deviceType={deviceType}
      />
    </main>
  );
};

export default InfraMaster;

const RoutePanel = React.memo(
  function RoutePanelInner({
    Comp,
    param,
    pgmId,
    outParam,
    registerOutParam,
    unregisterOutParam,
    deviceType,
  }: RoutePanelProps) {
    const compRef = React.useRef<any>(null);

    React.useEffect(() => {
      registerOutParam(pgmId, (payload) => {
        compRef.current?.onModalPayload?.(payload);
      });

      return () => {
        unregisterOutParam(pgmId);
      };
    }, [pgmId, registerOutParam, unregisterOutParam]);
    return (
      <Comp
        ref={compRef}
        param={param}
        pgmId={pgmId}
        outParam={outParam}
        deviceType={deviceType}
      />
    );
  },
  (prev, next) => {
    if (!next.isActive) return true;
    return prev.param === next.param;
  },
);

type RoutePanelProps = {
  Comp: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<DefInfraComp> & React.RefAttributes<PageHandle>
  >;
  isActive: boolean;
  param: any;
  pgmId: string;
  outParam: (r: any) => void;
  registerOutParam: (pgmId: string, fn: (p: any) => void) => void;
  unregisterOutParam: (pgmId: string) => void;
  deviceType: DeviceType;
};
