import React, { useState } from "react";
import { ModalCust } from "../../comp/Common";
import UserInfo from "./UserInfo";
import Header from "./Header";
import Side from "./Side";
import Master from "./Master";
import Modal from "./Modal";

export default function Main() {
  //사이드

  return (
    <div>
      {/* 상단헤더 */}
      <Header />
      <Side />
      <Master />
    </div>
  );
}
