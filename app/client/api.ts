import { getClientConfig } from "../config/client";
import { ACCESS_CODE_PREFIX, Azure, ServiceProvider } from "../constant";
import { ChatMessage, ModelType, useAccessStore } from "../store";
import { ChatGPTApi } from "./platforms/openai";
// add by ynx
import { useChatStore, useAppConfig, DEFAULT_TOPIC } from "../store";

export const ROLES = ["system", "user", "assistant"] as const;
export type MessageRole = (typeof ROLES)[number];

export const Models = ["gpt-3.5-turbo", "gpt-4"] as const;
export type ChatModel = ModelType;

export interface RequestMessage {
  role: MessageRole;
  content: string;
}

export interface LLMConfig {
  model: string;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
  presence_penalty?: number;
  frequency_penalty?: number;
}

export interface ChatOptions {
  messages: RequestMessage[];
  config: LLMConfig;

  onUpdate?: (message: string, chunk: string) => void;
  onFinish: (message: string) => void;
  onError?: (err: Error) => void;
  onController?: (controller: AbortController) => void;
}

export interface LLMUsage {
  used: number;
  total: number;
}

export interface LLMModel {
  name: string;
  available: boolean;
}

export abstract class LLMApi {
  abstract chat(options: ChatOptions): Promise<void>;
  abstract usage(): Promise<LLMUsage>;
  abstract models(): Promise<LLMModel[]>;
}
const DEFAULT_AVATAR_URL =
  "data:image/png;base64,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";

type ProviderName = "openai" | "azure" | "claude" | "palm";

interface Model {
  name: string;
  provider: ProviderName;
  ctxlen: number;
}

interface ChatProvider {
  name: ProviderName;
  apiConfig: {
    baseUrl: string;
    apiKey: string;
    summaryModel: Model;
  };
  models: Model[];

  chat: () => void;
  usage: () => void;
}

export class ClientApi {
  public llm: LLMApi;

  constructor() {
    this.llm = new ChatGPTApi();
  }

  config() {}

  prompts() {}

  masks() {}

  async share(messages: ChatMessage[], avatarUrl: string | null = null) {
    const msgs = messages
      .map((m) => ({
        from: m.role === "user" ? "human" : "gpt",
        value: m.content,
      }))
      .concat([
        {
          from: "human",
          // value: "Share from [ChatGPT Next Web]: https://github.com/Yidadaa/ChatGPT-Next-Web",
          value: "",
        },
      ]);
    // 敬告二开开发者们，为了开源大模型的发展，请不要修改上述消息，此消息用于后续数据清洗使用
    // Please do not modify this message

    console.log("[Share]", messages, msgs);

    // changed by ynx
    const clientConfig = getClientConfig();
    const config = useAppConfig.getState();
    // 获取模型
    const model = config.modelConfig.model;
    // 获取标题
    // const chatStore = useChatStore();
    // const session = chatStore.currentSession();
    // const title = !session.topic ? DEFAULT_TOPIC : session.topic
    const shareUrl = "https://42share.com/srv/ext/conversation";
    const res = await fetch(shareUrl, {
      body: JSON.stringify({
        avatarUrl: avatarUrl || DEFAULT_AVATAR_URL,
        model: model,
        items: msgs,
        // title: DEFAULT_TOPIC,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      credentials: "include",
    });

    if (res.ok) {
      const resJson = await res.json();
      console.log("[Share]", resJson);
      if (resJson.id) {
        return `https://42share.com/gpt/${resJson.id}`;
      }
    } else {
      const { message } = await res.json();
      alert(`分享失败：${message}`);
    }
    // changed end
  }
}

export const api = new ClientApi();

export function getHeaders() {
  const accessStore = useAccessStore.getState();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-requested-with": "XMLHttpRequest",
  };

  const isAzure = accessStore.provider === ServiceProvider.Azure;
  const authHeader = isAzure ? "api-key" : "Authorization";
  const apiKey = isAzure ? accessStore.azureApiKey : accessStore.openaiApiKey;

  const makeBearer = (s: string) => `${isAzure ? "" : "Bearer "}${s.trim()}`;
  const validString = (x: string) => x && x.length > 0;

  // use user's api key first
  if (validString(apiKey)) {
    headers[authHeader] = makeBearer(apiKey);
  } else if (
    accessStore.enabledAccessControl() &&
    validString(accessStore.accessCode)
  ) {
    headers[authHeader] = makeBearer(
      ACCESS_CODE_PREFIX + accessStore.accessCode,
    );
  }

  return headers;
}
