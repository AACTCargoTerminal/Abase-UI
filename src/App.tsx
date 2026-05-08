import { Provider } from "react-redux";
import store from "./slices/store";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./screens/common/Login";
import { ConfirmIO, Error, Loading } from "./comp/Common";
import Main from "./screens/common/Main";
import "./App.css";
import InfraLogin from "./infraScreens/InfraLogin";
import InfraMain from "./infraScreens/InfraMain";
function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/Sams" replace />} />
          <Route path="/Sams" element={<Login />} />
          <Route path="/Sams/Main" element={<Main />} />
          <Route path="/Infra" element={<InfraLogin />} />
          <Route path="/Infra/Main" element={<InfraMain />} />
        </Routes>
        <Error />
        <Loading />
        <ConfirmIO />
      </BrowserRouter>
    </Provider>
  );
}

export default App;
