import { Provider } from "react-redux";
import store from "./slices/store";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ConfirmIO, Error, Loading } from "./comp/Common";
import Main from "./screens/common/Main";
import "./App.css";
import InfraMain from "./infraScreens/InfraMain";
import Root from "./Root";
function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Root />} />
          <Route path="/sams/Main" element={<Main />} />
          <Route path="/intra/Main" element={<InfraMain />} />
        </Routes>
        <Error />
        <Loading />
        <ConfirmIO />
      </BrowserRouter>
    </Provider>
  );
}

export default App;
