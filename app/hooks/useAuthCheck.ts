import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccessStore } from "../store";
import { Path } from "../constant";

export function useAuthCheck() {
  const navigate = useNavigate();
  const accessStore = useAccessStore();

  useEffect(() => {
    const checkAuth = async () => {
      const isAuthorized =
        accessStore.isValidOpenAI() ||
        accessStore.isValidAzure() ||
        accessStore.isValidGoogle() ||
        accessStore.isValidAnthropic() ||
        accessStore.isValidBaidu() ||
        accessStore.isValidByteDance() ||
        accessStore.isValidAlibaba() ||
        accessStore.isValidTencent() ||
        accessStore.isValidMoonshot() ||
        accessStore.isValidIflytek() ||
        !accessStore.enabledAccessControl() ||
        (accessStore.enabledAccessControl() &&
          (await accessStore.validateAccessCode()));

      const currentPath = window.location.hash.slice(1);

      if (!isAuthorized && currentPath !== Path.Auth) {
        navigate(Path.Auth);
      }
    };

    checkAuth();
    window.addEventListener("hashchange", checkAuth);

    return () => {
      window.removeEventListener("hashchange", checkAuth);
    };
  }, [navigate, accessStore]);
}
