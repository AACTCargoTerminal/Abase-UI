import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  RouteType,
  UserInfoType,
  UserSchType,
  UserState,
} from "../Util/Type";
import moment from "moment";

const initialState: UserState = {
  userInfo: null,
  menu: [],
  serverFlag: false,
  route: null,
  routeArray: [],
  loading: false,
  sch: { schSid: 0, inout: "I", fltDate: moment().format("YYYYMMDD") },
  modalRoute: { flag: false },
  authCheck: false,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    pushMenu(state, action: PayloadAction<Array<any>>) {
      state.menu = action.payload;
    },
    changeServer(state, action: PayloadAction<boolean>) {
      state.serverFlag = action.payload;
    },
    selectNav(state, action: PayloadAction<RouteType>) {
      if (!action.payload.MENU_ID) {
        action.payload.MENU_ID = action.payload.PROGRAM_ID;
      }
      state.route = action.payload;
      const findMenu = state.routeArray.find(
        (item) => item.MENU_ID === action.payload.MENU_ID,
      );
      if (findMenu) {
        findMenu.param = action.payload.param;
      } else {
        state.routeArray.push(action.payload);
      }
      state.modalRoute.flag = false;
    },
    clearParam(state) {
      if (state.route?.param) {
        state.route.param = null;
      }
    },
    pushLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    deleteNav(state, action: PayloadAction<RouteType>) {
      const tmp_array = state.routeArray.filter(
        (item) => item.MENU_ID !== action.payload.MENU_ID,
      );
      if (state.route?.MENU_ID === action.payload.MENU_ID) {
        if (tmp_array.length > 0) {
          state.route = tmp_array[tmp_array.length - 1];
          state.routeArray = tmp_array;
        } else {
          state.route = null;
          state.routeArray = [];
        }
      } else {
        state.routeArray = tmp_array;
      }
      state.modalRoute.flag = false;
    },
    clearAllUser(state) {
      return {
        ...initialState,
        route: state.route,
        routeArray: state.routeArray,
      };
    },
    clearAll(state) {
      return initialState;
    },
    pushUserInfo(state, action: PayloadAction<UserInfoType>) {
      const data = action.payload;
      state.userInfo = data;
    },
    pushSch(state, action: PayloadAction<UserSchType>) {
      state.sch = action.payload;
    },

    pushSchInout(state, action: PayloadAction<string>) {
      state.sch.inout = action.payload;
      state.sch.schSid = 0;
    },
    pushModalFlag(state, action: PayloadAction<boolean>) {
      state.modalRoute.flag = action.payload;
    },
    modalOpen(
      state,
      action: PayloadAction<{
        route: RouteType[];
      }>,
    ) {
      state.modalRoute.flag = true;
      state.modalRoute.modalRoute = action.payload.route;
    },
    changeAutoFlag(state, action: PayloadAction<boolean>) {
      state.authCheck = action.payload;
    },
  },
});

export const {
  clearAllUser,
  pushMenu,
  changeServer,
  pushUserInfo,
  selectNav,
  deleteNav,
  pushLoading,
  clearParam,
  pushSch,
  pushSchInout,
  pushModalFlag,
  modalOpen,
  changeAutoFlag,
  clearAll,
} = userSlice.actions;
export default userSlice.reducer;
