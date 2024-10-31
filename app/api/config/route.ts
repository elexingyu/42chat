import { NextResponse } from "next/server";
import { getServerSideConfig } from "../../config/server";
import md5 from "spark-md5";

const serverConfig = getServerSideConfig();

// Danger! Do not hard code any secret value here!
// 警告！不要在这里写入任何敏感信息！
const DANGER_CONFIG = {
  needCode: serverConfig.needCode,
  hideUserApiKey: serverConfig.hideUserApiKey,
  disableGPT4: serverConfig.disableGPT4,
  hideBalanceQuery: serverConfig.hideBalanceQuery,
  disableFastLink: serverConfig.disableFastLink,
  customModels: serverConfig.customModels,
  defaultModel: serverConfig.defaultModel,
};

declare global {
  type DangerConfig = typeof DANGER_CONFIG;
}

async function handle(req: Request) {
  if (req.method === "POST") {
    const { accessCode } = await req.json(); // 前端传递的访问码
    const hashedInputCode = md5.hash(accessCode).trim();

    // 根据访问码获取用户配置
    const userConfig = serverConfig.accessCodesMap.get(hashedInputCode);

    if (userConfig) {
      // 返回非敏感的配置信息
      return NextResponse.json({
        apiKey: userConfig.apiKey, // 添加这一行
        customModels: userConfig.customModels,
        defaultModel: userConfig.defaultModel,
        baseUrl: userConfig.baseUrl, // 添加 baseUrl
      });
    } else {
      return NextResponse.json(
        { error: "Invalid access code" },
        { status: 403 },
      );
    }
  }

  // 默认返回非敏感的全局配置信息
  return NextResponse.json(DANGER_CONFIG);
}

export const GET = handle;
export const POST = handle;

export const runtime = "edge";
