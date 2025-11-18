import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DigitalHumanPage from "@/pages/DigitalHumanPage";
import AdvancedDigitalHumanPage from "@/pages/AdvancedDigitalHumanPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AdvancedDigitalHumanPage />} />
        <Route path="/digital-human" element={<DigitalHumanPage />} />
        <Route path="/advanced" element={<AdvancedDigitalHumanPage />} />
      </Routes>
    </Router>
  );
}
