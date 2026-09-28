import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Lets a Dashboard "Quick Action" jump straight into a page's create flow by
// navigating with `state: { openCreate: true }`. Runs once on mount, then
// clears the state via a replace-navigation so back/forward or a refresh
// doesn't reopen the modal.
export function useOpenCreateFromNavigation(onOpen: () => void): void {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if ((location.state as { openCreate?: boolean } | null)?.openCreate) {
      onOpen();
      navigate(location.pathname, { replace: true, state: null });
    }
    // Intentionally runs once on mount only — location.state is consumed and
    // cleared immediately, so re-running on every location change would loop.
  }, []);
}
