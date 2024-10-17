import { getClientConfig } from "../config/client";
import {
  ACCESS_CODE_PREFIX,
  ModelProvider,
  ServiceProvider,
} from "../constant";
import {
  ChatMessageTool,
  ChatMessage,
  ModelType,
  useAccessStore,
  useChatStore,
  useAppConfig,
} from "../store";
import { ChatGPTApi, DalleRequestPayload } from "./platforms/openai";
import { GeminiProApi } from "./platforms/google";
import { ClaudeApi } from "./platforms/anthropic";
import { ErnieApi } from "./platforms/baidu";
import { DoubaoApi } from "./platforms/bytedance";
import { QwenApi } from "./platforms/alibaba";
import { HunyuanApi } from "./platforms/tencent";
import { MoonshotApi } from "./platforms/moonshot";
import { SparkApi } from "./platforms/iflytek";

export const ROLES = ["system", "user", "assistant"] as const;
export type MessageRole = (typeof ROLES)[number];

export const Models = ["gpt-3.5-turbo", "gpt-4"] as const;
export const TTSModels = ["tts-1", "tts-1-hd"] as const;
export type ChatModel = ModelType;

export interface MultimodalContent {
  type: "text" | "image_url";
  text?: string;
  image_url?: {
    url: string;
  };
}

export interface RequestMessage {
  role: MessageRole;
  content: string | MultimodalContent[];
}

export interface LLMConfig {
  model: string;
  providerName?: string;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
  presence_penalty?: number;
  frequency_penalty?: number;
  size?: DalleRequestPayload["size"];
  quality?: DalleRequestPayload["quality"];
  style?: DalleRequestPayload["style"];
}

export interface SpeechOptions {
  model: string;
  input: string;
  voice: string;
  response_format?: string;
  speed?: number;
  onController?: (controller: AbortController) => void;
}

export interface ChatOptions {
  messages: RequestMessage[];
  config: LLMConfig;

  onUpdate?: (message: string, chunk: string) => void;
  onFinish: (message: string) => void;
  onError?: (err: Error) => void;
  onController?: (controller: AbortController) => void;
  onBeforeTool?: (tool: ChatMessageTool) => void;
  onAfterTool?: (tool: ChatMessageTool) => void;
}

export interface LLMUsage {
  used: number;
  total: number;
}

export interface LLMModel {
  name: string;
  displayName?: string;
  available: boolean;
  provider: LLMModelProvider;
  sorted: number;
}

export interface LLMModelProvider {
  id: string;
  providerName: string;
  providerType: string;
  sorted: number;
}

export abstract class LLMApi {
  abstract chat(options: ChatOptions): Promise<void>;
  abstract speech(options: SpeechOptions): Promise<ArrayBuffer>;
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

  constructor(provider: ModelProvider = ModelProvider.GPT) {
    switch (provider) {
      case ModelProvider.GeminiPro:
        this.llm = new GeminiProApi();
        break;
      case ModelProvider.Claude:
        this.llm = new ClaudeApi();
        break;
      case ModelProvider.Ernie:
        this.llm = new ErnieApi();
        break;
      case ModelProvider.Doubao:
        this.llm = new DoubaoApi();
        break;
      case ModelProvider.Qwen:
        this.llm = new QwenApi();
        break;
      case ModelProvider.Hunyuan:
        this.llm = new HunyuanApi();
        break;
      case ModelProvider.Moonshot:
        this.llm = new MoonshotApi();
        break;
      case ModelProvider.Iflytek:
        this.llm = new SparkApi();
        break;
      default:
        this.llm = new ChatGPTApi();
    }
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

    const resJson = await res.json();
    console.log("[Share]", resJson);
    if (resJson.id) {
      return `https://42share.com/gpt/${resJson.id}`;
    }
  }
}

export function getBearerToken(
  apiKey: string,
  noBearer: boolean = false,
): string {
  return validString(apiKey)
    ? `${noBearer ? "" : "Bearer "}${apiKey.trim()}`
    : "";
}

export function validString(x: string): boolean {
  return x?.length > 0;
}

export function getHeaders(ignoreHeaders: boolean = false) {
  const accessStore = useAccessStore.getState();
  const chatStore = useChatStore.getState();
  let headers: Record<string, string> = {};
  if (!ignoreHeaders) {
    headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  const clientConfig = getClientConfig();

  function getConfig() {
    const modelConfig = chatStore.currentSession().mask.modelConfig;
    const isGoogle = modelConfig.providerName === ServiceProvider.Google;
    const isAzure = modelConfig.providerName === ServiceProvider.Azure;
    const isAnthropic = modelConfig.providerName === ServiceProvider.Anthropic;
    const isBaidu = modelConfig.providerName == ServiceProvider.Baidu;
    const isByteDance = modelConfig.providerName === ServiceProvider.ByteDance;
    const isAlibaba = modelConfig.providerName === ServiceProvider.Alibaba;
    const isMoonshot = modelConfig.providerName === ServiceProvider.Moonshot;
    const isIflytek = modelConfig.providerName === ServiceProvider.Iflytek;
    const isEnabledAccessControl = accessStore.enabledAccessControl();
    const apiKey = isGoogle
      ? accessStore.googleApiKey
      : isAzure
      ? accessStore.azureApiKey
      : isAnthropic
      ? accessStore.anthropicApiKey
      : isByteDance
      ? accessStore.bytedanceApiKey
      : isAlibaba
      ? accessStore.alibabaApiKey
      : isMoonshot
      ? accessStore.moonshotApiKey
      : isIflytek
      ? accessStore.iflytekApiKey && accessStore.iflytekApiSecret
        ? accessStore.iflytekApiKey + ":" + accessStore.iflytekApiSecret
        : ""
      : accessStore.openaiApiKey;
    return {
      isGoogle,
      isAzure,
      isAnthropic,
      isBaidu,
      isByteDance,
      isAlibaba,
      isMoonshot,
      isIflytek,
      apiKey,
      isEnabledAccessControl,
    };
  }

  function getAuthHeader(): string {
    return isAzure
      ? "api-key"
      : isAnthropic
      ? "x-api-key"
      : isGoogle
      ? "x-goog-api-key"
      : "Authorization";
  }

  const {
    isGoogle,
    isAzure,
    isAnthropic,
    isBaidu,
    apiKey,
    isEnabledAccessControl,
  } = getConfig();
  // when using baidu api in app, not set auth header
  if (isBaidu && clientConfig?.isApp) return headers;

  const authHeader = getAuthHeader();

  const bearerToken = getBearerToken(
    apiKey,
    isAzure || isAnthropic || isGoogle,
  );

  if (bearerToken) {
    headers[authHeader] = bearerToken;
  } else if (isEnabledAccessControl && validString(accessStore.accessCode)) {
    headers["Authorization"] = getBearerToken(
      ACCESS_CODE_PREFIX + accessStore.accessCode,
    );
  }

  return headers;
}

export function getClientApi(provider: ServiceProvider): ClientApi {
  switch (provider) {
    case ServiceProvider.Google:
      return new ClientApi(ModelProvider.GeminiPro);
    case ServiceProvider.Anthropic:
      return new ClientApi(ModelProvider.Claude);
    case ServiceProvider.Baidu:
      return new ClientApi(ModelProvider.Ernie);
    case ServiceProvider.ByteDance:
      return new ClientApi(ModelProvider.Doubao);
    case ServiceProvider.Alibaba:
      return new ClientApi(ModelProvider.Qwen);
    case ServiceProvider.Tencent:
      return new ClientApi(ModelProvider.Hunyuan);
    case ServiceProvider.Moonshot:
      return new ClientApi(ModelProvider.Moonshot);
    case ServiceProvider.Iflytek:
      return new ClientApi(ModelProvider.Iflytek);
    default:
      return new ClientApi(ModelProvider.GPT);
  }
}
