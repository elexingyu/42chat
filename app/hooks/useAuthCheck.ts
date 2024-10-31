import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccessStore } from "../store";
import { Path } from "../constant";

export function useAuthCheck() {
  const navigate = useNavigate();
  const accessStore = useAccessStore();

  // 重置访问凭证的函数
  const resetAccessCredentials = () => {
    accessStore.update((access) => {
      access.openaiApiKey = "";
      access.accessCode = "";
      access.openaiUrl = "";
      access.customModels = "";
      access.defaultModel = "";
      // 可以根据需要添加其他需要重置的字段
    });
  };

  useEffect(() => {
    const checkAuth = async () => {
      // 如果有访问码，验证其有效性
      if (accessStore.accessCode) {
        try {
          const response = await fetch("/api/config", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              accessCode: accessStore.accessCode,
            }),
          });

          if (!response.ok) {
            // 如果验证失败，重置凭证并跳转到认证页面
            resetAccessCredentials();
            navigate(Path.Auth);
            return;
          }
        } catch (e) {
          console.error("[Auth] failed to verify access code:", e);
          resetAccessCredentials();
          navigate(Path.Auth);
          return;
        }
      }

      // 原有的授权检查逻辑
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
