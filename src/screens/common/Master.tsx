import React, { useState } from "react";
import { ROUTE_MAP } from "../../route";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../slices/store";
import { pushSchInout } from "../../slices/user";
import type {
  DefComp,
  PageHandle,
  TableRow,
  UserSchType,
} from "../../Util/Type";
import Redirect from "./Redirect";
import Modal from "./Modal";
import { hasKey } from "../../Util/Util";
import { CommonContainer } from "../../comp/Container";
import Board from "./Board";

function useStableMap<T>() {
  const ref = React.useRef<Record<string, T>>({});
  return ref;
}

export default function Master() {
  const dispatch = useDispatch();
  const route = useSelector((state: RootState) => state.user.route);
  const routeArray = useSelector((state: RootState) => state.user.routeArray);
  const sch = useSelector((state: RootState) => state.user.sch);

  const stableSchMap = useStableMap<UserSchType>();
  const stableOutParamMap = useStableMap<(ret: any) => void>();
  const stableParamMap = useStableMap<any>();
  const outParamHandlers = React.useRef<Record<string, (payload: any) => void>>(
    {},
  );

  const activeId = route?.PROGRAM_ID;

  const getOutParam = React.useCallback(
    (pgmId: string) => {
      if (!stableOutParamMap.current[pgmId]) {
        stableOutParamMap.current[pgmId] = (ret: any) => {
          if (ret["INOUT_FLAG"]) {
            dispatch(pushSchInout(ret["INOUT_FLAG"]));
          }
        };
      }
      return stableOutParamMap.current[pgmId];
    },
    [dispatch, sch],
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
    <main className="fixed top-[7%] left-[13%] w-[calc(100vw-13vw)] h-[calc(100vh-7vh)] overflow-x-hidden overflow-y-auto">
      {routeArray.length > 0 ? (
        routeArray.map((r) => {
          if (r.MENU_ID === undefined && r.PROGRAM_ID === undefined) {
            return null;
          }

          const Comp = hasKey(ROUTE_MAP, r.MENU_ID)
            ? ROUTE_MAP[r.MENU_ID]
            : hasKey(ROUTE_MAP, r.PROGRAM_ID)
              ? ROUTE_MAP[r.PROGRAM_ID]
              : null;
          if (!Comp) return null;

          const isActive = activeId === r.PROGRAM_ID;

          // 비활성 탭은 "처음 값"을 계속 사용 (props 고정)
          if (isActive) {
            stableSchMap.current[r.PROGRAM_ID] = sch;
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

            stableParamMap.current[r.PROGRAM_ID] = tmp;
          }

          const schToPass = stableSchMap.current[r.PROGRAM_ID];
          const paramToPass = stableParamMap.current[r.PROGRAM_ID];
          const outParamToPass = isActive
            ? getOutParam(r.PROGRAM_ID)
            : stableOutParamMap.current[r.PROGRAM_ID];

          return (
            <div
              key={r.PROGRAM_ID}
              style={{
                display: isActive ? "block" : "none",
                width: "100%",
                height: "100%",
              }}>
              <RoutePanel
                Comp={Comp}
                isActive={isActive}
                sch={schToPass}
                param={paramToPass}
                pgmId={r.PROGRAM_ID}
                outParam={outParamToPass || (() => {})}
                registerOutParam={registerOutParam}
                unregisterOutParam={unregisterOutParam}
              />
            </div>
          );
        })
      ) : (
        <Board deviceType="PC" />
      )}

      {route &&
        !hasKey(ROUTE_MAP, route.MENU_ID) &&
        !hasKey(ROUTE_MAP, route.PROGRAM_ID) && <Redirect />}
      <Modal
        outParam={(r) => {
          emitToActive(r);
        }}
        deviceType="PC"
      />
    </main>
  );
}

const RoutePanel = React.memo(
  function RoutePanelInner({
    Comp,
    sch,
    param,
    pgmId,
    outParam,
    registerOutParam,
    unregisterOutParam,
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
        sch={sch}
        param={param}
        pgmId={pgmId}
        outParam={outParam}
      />
    );
  },
  (prev, next) => {
    if (!next.isActive) return true;
    return (
      prev.sch.fltDate === next.sch.fltDate &&
      prev.sch.inout === next.sch.inout &&
      prev.sch.schSid === next.sch.schSid &&
      prev.param === next.param
    );
  },
);

type RoutePanelProps = {
  Comp: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<DefComp> & React.RefAttributes<PageHandle>
  >;
  isActive: boolean;
  sch: UserSchType;
  param: any;
  pgmId: string;
  outParam: (r: any) => void;
  registerOutParam: (pgmId: string, fn: (p: any) => void) => void;
  unregisterOutParam: (pgmId: string) => void;
};
