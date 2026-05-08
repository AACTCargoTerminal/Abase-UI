import { combineReducers } from "@reduxjs/toolkit";
import err from "./err";
import user from "./user";

const rootReducer = combineReducers({ err, user });

export default rootReducer;
