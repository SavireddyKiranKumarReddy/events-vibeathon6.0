import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/r2")({
  component: () => <Outlet />,
});
