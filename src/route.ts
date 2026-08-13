//라우팅부분

import React from "react";
import type { BtnType, DefComp, DefInfraComp, ModalComp } from "./Util/Type";
import { Btn } from "./comp/Btn";
export const ROUTE_IMPORTERS = {
  MSG060: () => import("./screens/cimp/CimpManagement"),
  MSG040: () => import("./screens/cimp/Fwb16"),
  MSG050: () => import("./screens/cimp/Fhl"),
  MSG010: () => import("./screens/cimp/SitaManage"),
  WMAWB0011: () => import("./screens/cimp/Fwb"),
} as const;

export type RouteKey = keyof typeof ROUTE_IMPORTERS;

export const ROUTE_MAP: Record<
  RouteKey,
  React.LazyExoticComponent<React.ComponentType<DefComp>>
> = {
  MSG060: React.lazy(ROUTE_IMPORTERS.MSG060),
  MSG040: React.lazy(ROUTE_IMPORTERS.MSG040),
  MSG050: React.lazy(ROUTE_IMPORTERS.MSG050),
  MSG010: React.lazy(ROUTE_IMPORTERS.MSG010),
  WMAWB0011: React.lazy(ROUTE_IMPORTERS.WMAWB0011),
};

export const ROUTE_INFRA_IMPORTERS = {
  WORK010: () => import("./infraScreens/work/WorkMgm"),
  WORK020: () => import("./infraScreens/work/WorkTimeMgm"),
  WORK040: () => import("./infraScreens/work/WorkTimeAdm"),
  WORK050: () => import("./infraScreens/work/WorkHrMgm"),
  INFRASYS010: () => import("./infraScreens/sys/UserMgm"),
  INFRASYS020: () => import("./infraScreens/sys/CommonMgm"),
  INFRASYS030: () => import("./infraScreens/sys/CommonMgm"),
  INFRASYS040: () => import("./infraScreens/sys/CommonMgm"),
  INFRASYS050: () => import("./infraScreens/sys/CommonMgm"),
  INFRASYS060: () => import("./infraScreens/sys/CommonMgm"),
  INFRASYS070: () => import("./infraScreens/sys/CommonMgm"),
  INFRASYS080: () => import("./infraScreens/sys/CommonMgm"),
  INFRASYS090: () => import("./infraScreens/sys/CommonMgm"),
  INFRASYS100: () => import("./infraScreens/sys/CommonMgm"),
  INFRASYS110: () => import("./infraScreens/sys/CommonMgm"),
} as const;

export type RouteInfraKey = keyof typeof ROUTE_INFRA_IMPORTERS;

export const INFRA_ROUTE_MAP: Record<
  RouteInfraKey,
  React.LazyExoticComponent<React.ComponentType<DefInfraComp>>
> = {
  WORK010: React.lazy(ROUTE_INFRA_IMPORTERS.WORK010), //IFWOK0010,/infraScreens,INFRAWORKMGM,근무자 스케줄 관리,MDI
  WORK020: React.lazy(ROUTE_INFRA_IMPORTERS.WORK020), //IFWOK0020,/infraScreens/work/,WORKTIMEMGM,시간 외 근무,Mobile&Web
  WORK040: React.lazy(ROUTE_INFRA_IMPORTERS.WORK040), //IFWOK0021,/infraScreens/work/,WORKTIMEADM,시간 외 근무 ( 팀장 ),MDI
  WORK050: React.lazy(ROUTE_INFRA_IMPORTERS.WORK050), //IFWOK0030,/infraScreens/work/,WORKHRMGM,인사팀 관리,MDI
  INFRASYS010: React.lazy(ROUTE_INFRA_IMPORTERS.INFRASYS010), //CMUSR0022,/infraScreens/sys,USERMGM,사용자 관리,MDI
  INFRASYS020: React.lazy(ROUTE_INFRA_IMPORTERS.INFRASYS020), //CMCOD0031,/infraScreens/sys/,COMMONMGM,공통코드관리,MDI
  INFRASYS030: React.lazy(ROUTE_INFRA_IMPORTERS.INFRASYS030),
  INFRASYS040: React.lazy(ROUTE_INFRA_IMPORTERS.INFRASYS040),
  INFRASYS050: React.lazy(ROUTE_INFRA_IMPORTERS.INFRASYS050),
  INFRASYS060: React.lazy(ROUTE_INFRA_IMPORTERS.INFRASYS060),
  INFRASYS070: React.lazy(ROUTE_INFRA_IMPORTERS.INFRASYS070),
  INFRASYS080: React.lazy(ROUTE_INFRA_IMPORTERS.INFRASYS080),
  INFRASYS090: React.lazy(ROUTE_INFRA_IMPORTERS.INFRASYS090),
  INFRASYS100: React.lazy(ROUTE_INFRA_IMPORTERS.INFRASYS100),
  INFRASYS110: React.lazy(ROUTE_INFRA_IMPORTERS.INFRASYS110),
};

export const MODAL_ROUTE_IMPORTERS = {
  USER_INFO: () => import("./screens/common/UserInfo"),
  FSU_ARR: () => import("./screens/cimp/FsuArr"),
  FSU_RCF: () => import("./screens/cimp/FsuRcf"),
  FSU_NFD: () => import("./screens/cimp/FsuNfd"),
  FSU_DLV: () => import("./screens/cimp/FsuDlv"),
  FSU_DIS: () => import("./screens/cimp/FsuDis"),
  FSU_TFD: () => import("./screens/cimp/FsuTfd"),
  FSU_FOH: () => import("./screens/cimp/FsuFoh"),
  FSU_RCT: () => import("./screens/cimp/FsuRct"),
  FSU_RCS: () => import("./screens/cimp/FsuRcs"),
  FSU_DEP: () => import("./screens/cimp/FsuDep"),
  EXPORT_P010: () => import("./screens/cimp/ManifestPrint"),
  MSITP010: () => import("./screens/common/PrintView"),
  WMSCH0040: () => import("./screens/common/SchChange"),
  IFEDI0070: () => import("./screens/cimp/NewSitaMsg"),
  CMCUS0030: () => import("./screens/common/CustPop"),
  USERMODAL: () => import("./infraScreens/sys/UserModal"),
  USERRESMGM: () => import("./infraScreens/sys/UserResourceMgm"),
  WORK_TIME_INS: () => import("./infraScreens/work/WorkTimeInsert"),
  WORK_HR_REQ_DENY: () => import("./infraScreens/work/WorkHrReqDeny"),
  WORK_TIME_ADM_INS: () => import("./infraScreens/work/WorkTimeAdmInsert"),
} as const;

export type ModalRouteKey = keyof typeof MODAL_ROUTE_IMPORTERS;

export const MODAL_ROUTE_MAP: Record<
  ModalRouteKey,
  React.LazyExoticComponent<React.ComponentType<ModalComp>>
> = {
  USER_INFO: React.lazy(MODAL_ROUTE_IMPORTERS.USER_INFO),
  FSU_ARR: React.lazy(MODAL_ROUTE_IMPORTERS.FSU_ARR),
  FSU_DEP: React.lazy(MODAL_ROUTE_IMPORTERS.FSU_DEP),
  FSU_DIS: React.lazy(MODAL_ROUTE_IMPORTERS.FSU_DIS),
  FSU_DLV: React.lazy(MODAL_ROUTE_IMPORTERS.FSU_DLV),
  FSU_FOH: React.lazy(MODAL_ROUTE_IMPORTERS.FSU_FOH),
  FSU_NFD: React.lazy(MODAL_ROUTE_IMPORTERS.FSU_NFD),
  FSU_RCF: React.lazy(MODAL_ROUTE_IMPORTERS.FSU_RCF),
  FSU_RCS: React.lazy(MODAL_ROUTE_IMPORTERS.FSU_RCS),
  FSU_RCT: React.lazy(MODAL_ROUTE_IMPORTERS.FSU_RCT),
  FSU_TFD: React.lazy(MODAL_ROUTE_IMPORTERS.FSU_TFD),
  EXPORT_P010: React.lazy(MODAL_ROUTE_IMPORTERS.EXPORT_P010),
  MSITP010: React.lazy(MODAL_ROUTE_IMPORTERS.MSITP010),
  WMSCH0040: React.lazy(MODAL_ROUTE_IMPORTERS.WMSCH0040),
  IFEDI0070: React.lazy(MODAL_ROUTE_IMPORTERS.IFEDI0070),
  CMCUS0030: React.lazy(MODAL_ROUTE_IMPORTERS.CMCUS0030),
  USERMODAL: React.lazy(MODAL_ROUTE_IMPORTERS.USERMODAL),
  USERRESMGM: React.lazy(MODAL_ROUTE_IMPORTERS.USERRESMGM),
  WORK_TIME_INS: React.lazy(MODAL_ROUTE_IMPORTERS.WORK_TIME_INS),
  WORK_HR_REQ_DENY: React.lazy(MODAL_ROUTE_IMPORTERS.WORK_HR_REQ_DENY),
  WORK_TIME_ADM_INS: React.lazy(MODAL_ROUTE_IMPORTERS.WORK_TIME_ADM_INS),
};

export const MODAL_BTN_MAP: Record<ModalRouteKey, BtnType[]> = {
  USER_INFO: [{ txt: "SAVE", type: "SAVE", actionType: "MODAL" }],
  FSU_ARR: [
    { txt: "SAVE", type: "SAVE", actionType: "MODAL" },
    { txt: "SEND SCREEN", type: "NONE", actionType: "ALL" },
  ],
  FSU_DEP: [
    { txt: "SAVE", type: "SAVE", actionType: "MODAL" },
    { txt: "SEND SCREEN", type: "NONE", actionType: "ALL" },
  ],
  FSU_DIS: [
    { txt: "SAVE", type: "SAVE", actionType: "MODAL" },
    { txt: "SEND SCREEN", type: "NONE", actionType: "ALL" },
  ],
  FSU_DLV: [
    { txt: "SAVE", type: "SAVE", actionType: "MODAL" },
    { txt: "SEND SCREEN", type: "NONE", actionType: "ALL" },
  ],
  FSU_FOH: [
    { txt: "SAVE", type: "SAVE", actionType: "MODAL" },
    { txt: "SEND SCREEN", type: "NONE", actionType: "ALL" },
  ],
  FSU_NFD: [
    { txt: "SAVE", type: "SAVE", actionType: "MODAL" },
    { txt: "SEND SCREEN", type: "NONE", actionType: "ALL" },
  ],
  FSU_RCF: [
    { txt: "SAVE", type: "SAVE", actionType: "MODAL" },
    { txt: "SEND SCREEN", type: "NONE", actionType: "ALL" },
  ],
  FSU_RCS: [
    { txt: "SAVE", type: "SAVE", actionType: "MODAL" },
    { txt: "SEND SCREEN", type: "NONE", actionType: "ALL" },
  ],
  FSU_RCT: [
    { txt: "SAVE", type: "SAVE", actionType: "MODAL" },
    { txt: "SEND SCREEN", type: "NONE", actionType: "ALL" },
  ],
  FSU_TFD: [
    { txt: "SAVE", type: "SAVE", actionType: "MODAL" },
    { txt: "SEND SCREEN", type: "NONE", actionType: "ALL" },
  ],
  EXPORT_P010: [],
  MSITP010: [],
  WMSCH0040: [],
  IFEDI0070: [
    { type: "NONE", txt: "NEW", actionType: "MODAL" },
    { type: "NONE", txt: "SEND", actionType: "MODAL" },
    { type: "SAVE", txt: "SAVE", actionType: "MODAL" },
    { type: "PRINT", txt: "PRINT", actionType: "MODAL" },
  ],
  CMCUS0030: [{ type: "SEARCH", txt: "SEARCH", actionType: "MODAL" }],
  USERMODAL: [
    { type: "SEARCH", txt: "신규", actionType: "MODAL" },
    { type: "SAVE", txt: "저장", actionType: "MODAL" },
    { type: "DELETE", txt: "삭제", actionType: "MODAL" },
  ],
  USERRESMGM: [
    { type: "SEARCH", txt: "신규", actionType: "MODAL" },
    { type: "SAVE", txt: "저장", actionType: "MODAL" },
    { type: "DELETE", txt: "삭제", actionType: "MODAL" },
  ],
  WORK_TIME_INS: [{ type: "SAVE", txt: "저장", actionType: "MODAL" }],
  WORK_HR_REQ_DENY: [{ type: "SAVE", txt: "저장", actionType: "ALL" }],
  WORK_TIME_ADM_INS: [{ type: "SAVE", txt: "저장", actionType: "MODAL" }],
};

export const MODAL_SIZE_MAP: Record<
  ModalRouteKey,
  "sm" | "md" | "lg" | "xl" | "full"
> = {
  CMCUS0030: "lg",
  EXPORT_P010: "lg",
  FSU_ARR: "lg",
  FSU_DEP: "lg",
  FSU_DIS: "lg",
  FSU_DLV: "lg",
  FSU_FOH: "lg",
  FSU_NFD: "lg",
  FSU_RCF: "lg",
  FSU_RCS: "lg",
  FSU_RCT: "lg",
  FSU_TFD: "lg",
  IFEDI0070: "lg",
  MSITP010: "full",
  USER_INFO: "md",
  WMSCH0040: "lg",
  USERMODAL: "lg",
  USERRESMGM: "lg",
  WORK_TIME_INS: "md",
  WORK_HR_REQ_DENY: "md",
  WORK_TIME_ADM_INS: "md",
};
