import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccessStore } from "../store";
import { Path } from "../constant";

export function useAuthCheck() {
  const navigate = useNavigate();
  const accessStore = useAccessStore();

  // 重置所有凭证
  const resetAccessCredentials = () => {
    accessStore.update((access) => {
      access.openaiApiKey = "";
      access.accessCode = "";
      access.openaiUrl = "";
      access.customModels = "";
      access.defaultModel = "";
    });
  };

  // 更新配置但保持访问码
  const updateConfiguration = (config: {
    apiKey: string;
    customModels: string;
    defaultModel: string;
    baseUrl: string;
  }) => {
    accessStore.update((access) => {
      // 只更新配置相关字段
      access.openaiApiKey = config.apiKey;
      access.customModels = config.customModels;
      access.defaultModel = config.defaultModel;
      access.openaiUrl = config.baseUrl;
    });
  };

  useEffect(() => {
    const checkAuth = async () => {
      // 如果有访问码，验证其有效性和配置
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
            // 访问码无效，完全重置
            resetAccessCredentials();
            navigate(Path.Auth);
            return;
          }

          // 获取最新配置
          const config = await response.json();

          // 检查是否需要更新配置
          const configChanged =
            config.customModels !== accessStore.customModels ||
            config.defaultModel !== accessStore.defaultModel ||
            config.baseUrl !== accessStore.openaiUrl ||
            config.apiKey !== accessStore.openaiApiKey;

          if (configChanged) {
            // 只更新配置，保持访问码
            updateConfiguration(config);
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
