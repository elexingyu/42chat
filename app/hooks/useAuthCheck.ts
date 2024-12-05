import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccessStore } from "../store";
import { Path } from "../constant";

export function useAuthCheck() {
  const navigate = useNavigate();
  const accessStore = useAccessStore();
  const [isChecking, setIsChecking] = useState(false);

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
      // 避免重复检查
      if (isChecking) return;
      setIsChecking(true);

      try {
        // 如果有访问码,验证其有效性
        if (accessStore.accessCode) {
          const response = await fetch("/api/config", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              accessCode: accessStore.accessCode,
            }),
          });

          if (response.status === 401 || response.status === 403) {
            resetAccessCredentials();
            navigate(Path.Auth, { replace: true }); // 使用 replace 避免产生历史记录
            return;
          }

          if (response.ok) {
            const config = await response.json();
            updateConfiguration(config);
          }
        } else if (window.location.pathname !== Path.Auth) {
          // 没有访问码且不在验证页面时跳转
          navigate(Path.Auth, { replace: true });
        }
      } catch (e) {
        console.error("[Auth] failed to verify access code:", e);
        resetAccessCredentials();
        navigate(Path.Auth, { replace: true });
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [navigate, accessStore.accessCode]); // 只在 accessCode 变化时重新验证
}
