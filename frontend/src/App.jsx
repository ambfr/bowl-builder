import { Route, Routes } from "react-router-dom";
import Layout from "./Layout";
import Builder from "./Builder";
import Orders from "./Orders";
import { LoginPage, RegisterPage } from "./AuthPages";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Builder />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
    </Routes>
  );
}