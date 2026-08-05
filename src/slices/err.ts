import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Error, ErrorState } from "../Util/Type";
import moment from "moment";

const initialState: ErrorState = { queue: [], rd: false, orgQue: [] };

const errSlice = createSlice({
  name: "err",
  initialState,
  reducers: {
    pushError: {
      reducer(state, action: PayloadAction<Error>) {
        const exists = state.queue.some((e) => e.id === action.payload.id);
        if (!exists) {
          state.queue.push(action.payload);
          if (action.payload.errFlag === "Y") {
            if (state.orgQue.length >= 10) {
              state.orgQue.pop();
            }
            state.orgQue.unshift({
              ...action.payload,
              time: moment().format("MM-DD HH:mm:ss"),
            });
          }
        }
      },
      prepare(args: { id: string; errFlag: string; errMsg: string }) {
        return {
          payload: {
            ...args,
            visible: false,
          },
        };
      },
    },
    changeVisible(state, action: PayloadAction<{ key: string; bol: boolean }>) {
      const target = state.queue.find((que) => que.id === action.payload.key);

      if (target) {
        target.visible = action.payload.bol;
      }
    },
    changeRd(state, action: PayloadAction<boolean>) {
      state.rd = action.payload;
    },
    delError(state, action: PayloadAction<string>) {
      state.queue = state.queue.filter((que) => que.id !== action.payload);
    },
    clearAllErr(state) {
      state.queue = [];
      state.rd = false;
      state.orgQue = [];
    },
  },
});

export const { pushError, clearAllErr, changeRd, delError, changeVisible } =
  errSlice.actions;
export default errSlice.reducer;
