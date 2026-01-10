import { Outlet } from "react-router-dom";

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Public pages like LandingPage render here */}
      <Outlet />
    </div>
  );
}
