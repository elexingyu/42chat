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
  try {
    console.log("[Config API] Request Method:", req.method);

    if (req.method === "POST") {
      const rawBody = await req.text();
      console.log("[Config API] Raw request body:", rawBody);

      let body: { accessCode?: string } = {};
      try {
        body = rawBody ? JSON.parse(rawBody) : {};
      } catch (e) {
        console.error("[Config API] JSON parse error:", e);
        return NextResponse.json(
          { error: "Invalid JSON format" },
          { status: 400 },
        );
      }

      const accessCode = body?.accessCode;

      // 如果需要访问码但未提供,返回401
      if (
        serverConfig.needCode &&
        (!accessCode || typeof accessCode !== "string")
      ) {
        return NextResponse.json(
          { error: "Access code required" },
          { status: 401 },
        );
      }

      if (accessCode && typeof accessCode === "string") {
        const hashedInputCode = md5.hash(accessCode.trim());
        const userConfig = serverConfig.accessCodesMap.get(hashedInputCode);

        if (userConfig) {
          return NextResponse.json({
            apiKey: userConfig.apiKey,
            customModels: userConfig.customModels,
            defaultModel: userConfig.defaultModel,
            baseUrl: userConfig.baseUrl,
          });
        } else {
          return NextResponse.json(
            { error: "Invalid access code" },
            { status: 403 },
          );
        }
      }
    }

    // GET 请求时,如果需要访问码则返回401
    if (serverConfig.needCode) {
      return NextResponse.json(
        { error: "Access code required" },
        { status: 401 },
      );
    }

    return NextResponse.json(DANGER_CONFIG);
  } catch (error) {
    console.error("[Config API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: (error as Error).message },
      { status: 500 },
    );
  }
}

export const GET = handle;
export const POST = handle;

export const runtime = "edge";
