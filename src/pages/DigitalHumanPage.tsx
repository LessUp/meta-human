import { Navigate } from "react-router-dom";

/**
 * 旧版数字人页面 — 重定向到新首页
 * @deprecated 请使用 HomePage
 */
export default function DigitalHumanPage() {
  return <Navigate to="/" replace />;
}
