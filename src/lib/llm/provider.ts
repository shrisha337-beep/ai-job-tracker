/**
 * src/lib/llm/provider.ts
 *
 * Unified LLM Provider Interface.
 *
 * Provider selection:
 * - Default: OpenAiProvider (reading OPENAI_MODEL from env, fallback "gpt-4o-mini").
 * - Secondary / Disabled: BedrockProvider (Converse API, used ONLY if LLM_PROVIDER=bedrock).
 *
 * Note: AWS SDK is dynamically imported inside BedrockProvider so that it is never
 * loaded into memory or bundled when running the default OpenAI path.
 */

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  toolCallId?: string;
  toolCalls?: LlmToolCall[];
}

export interface LlmToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema object
}

export interface LlmToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface LlmUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface LlmChatResponse {
  text: string;
  toolCalls: LlmToolCall[];
  model: string;
  raw?: unknown;
  usage?: LlmUsage;
}

export interface LlmProvider {
  readonly name: string;
  chat(messages: LlmMessage[], tools?: LlmToolDefinition[]): Promise<LlmChatResponse>;
}

export class LlmRateLimitError extends Error {
  readonly status = 429;
  constructor(message = 'Rate limit exceeded (HTTP 429)') {
    super(message);
    this.name = 'LlmRateLimitError';
  }
}

export class OpenAiProvider implements LlmProvider {
  readonly name = 'openai';
  private readonly defaultModel = 'gpt-4o-mini';
  private readonly timeoutMs = 20_000; // 20s timeout
  private readonly maxRetries = 1;

  async chat(messages: LlmMessage[], tools?: LlmToolDefinition[]): Promise<LlmChatResponse> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }

    const rawModel = process.env.OPENAI_MODEL || this.defaultModel;
    const model = rawModel.replace(/[\\"'`]/g, '').trim() || this.defaultModel;

    const formattedMessages = messages.map((m) => {
      if (m.role === 'tool') {
        return {
          role: 'tool',
          content: m.content,
          tool_call_id: m.toolCallId || 'call_default',
        };
      }
      if (m.role === 'assistant' && m.toolCalls && m.toolCalls.length > 0) {
        return {
          role: 'assistant',
          content: m.content || null,
          tool_calls: m.toolCalls.map((tc) => ({
            id: tc.id,
            type: 'function',
            function: {
              name: tc.name,
              arguments: JSON.stringify(tc.arguments),
            },
          })),
        };
      }
      return {
        role: m.role,
        content: m.content,
        ...(m.name ? { name: m.name } : {}),
      };
    });

    const body: Record<string, unknown> = {
      model,
      messages: formattedMessages,
      temperature: 0,
    };

    if (tools && tools.length > 0) {
      body.tools = tools.map((t) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }));
      body.tool_choice = 'auto';
    }

    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        const rawBaseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
        const cleanBaseUrl = rawBaseUrl.replace(/\/+$/, '');
        const endpoint = cleanBaseUrl.endsWith('/chat/completions')
          ? cleanBaseUrl
          : `${cleanBaseUrl}/chat/completions`;

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          let errMsg = `OpenAI API returned HTTP ${res.status}`;
          try {
            const parsed = JSON.parse(errText);
            if (parsed.error?.message) {
              errMsg += `: ${parsed.error.message}`;
            }
          } catch {
            if (errText) errMsg += `: ${errText.slice(0, 100)}`;
          }

          if (res.status === 429) {
            if (attempt < this.maxRetries) {
              const retryAfterHeader = res.headers.get('retry-after');
              let waitMs = 2000;
              if (retryAfterHeader) {
                const parsed = parseFloat(retryAfterHeader);
                if (!isNaN(parsed) && parsed > 0) waitMs = Math.ceil(parsed * 1000);
              } else {
                const match = errText.match(/try again in ([0-9.]+)s/i);
                if (match) {
                  const parsed = parseFloat(match[1]);
                  if (!isNaN(parsed) && parsed > 0) waitMs = Math.ceil(parsed * 1000) + 500;
                }
              }
              await new Promise((r) => setTimeout(r, Math.min(30000, Math.max(2000, waitMs))));
              continue;
            }
            const err = new LlmRateLimitError(errMsg);
            (err as any).status = 429;
            (err as any).responseBody = errText;
            throw err;
          }

          const err = new Error(errMsg);
          (err as any).status = res.status;
          (err as any).responseBody = errText;
          throw err;
        }

        const data = await res.json();
        const choice = data.choices?.[0];
        const message = choice?.message;

        const text = message?.content || '';
        const toolCalls: LlmToolCall[] = (message?.tool_calls || []).map((tc: any) => {
          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(tc.function.arguments || '{}');
          } catch {
            args = { _raw: tc.function.arguments };
          }
          return {
            id: tc.id,
            name: tc.function.name,
            arguments: args,
          };
        });

        const usage = data.usage
          ? {
              promptTokens: Number(data.usage.prompt_tokens || 0),
              completionTokens: Number(data.usage.completion_tokens || 0),
              totalTokens: Number(data.usage.total_tokens || 0),
            }
          : undefined;

        return {
          text,
          toolCalls,
          model: data.model || model,
          raw: data,
          usage,
        };
      } catch (err: any) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (lastError instanceof LlmRateLimitError) {
          throw lastError;
        }
        if (attempt < this.maxRetries) {
          await new Promise((r) => setTimeout(r, 500));
        }
      }
    }

    throw lastError || new Error('OpenAI chat completion failed');
  }
}

export class BedrockProvider implements LlmProvider {
  readonly name = 'bedrock';
  private readonly defaultModel = 'amazon.nova-2-lite-v1:0';

  async chat(messages: LlmMessage[], tools?: LlmToolDefinition[]): Promise<LlmChatResponse> {
    // Dynamic import to prevent loading AWS SDK at module evaluation time
    const { BedrockRuntimeClient, ConverseCommand } = await import('@aws-sdk/client-bedrock-runtime');

    const region = process.env.AWS_REGION || 'us-east-1';
    const model = process.env.BEDROCK_MODEL_ID || this.defaultModel;

    const client = new BedrockRuntimeClient({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });

    const bedrockMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: [{ text: m.content }],
      }));

    const systemPrompt = messages.find((m) => m.role === 'system')?.content;

    const commandInput: any = {
      modelId: model,
      messages: bedrockMessages,
      inferenceConfig: {
        temperature: 0,
      },
    };

    if (systemPrompt) {
      commandInput.system = [{ text: systemPrompt }];
    }

    if (tools && tools.length > 0) {
      commandInput.toolConfig = {
        tools: tools.map((t) => ({
          toolSpec: {
            name: t.name,
            description: t.description,
            inputSchema: {
              json: t.parameters,
            },
          },
        })),
      };
    }

    const command = new ConverseCommand(commandInput);
    const response = await client.send(command);

    const contentBlocks = response.output?.message?.content || [];
    let text = '';
    const toolCalls: LlmToolCall[] = [];

    for (const block of contentBlocks) {
      if (block.text) {
        text += block.text;
      }
      if (block.toolUse) {
        toolCalls.push({
          id: block.toolUse.toolUseId || '',
          name: block.toolUse.name || '',
          arguments: (block.toolUse.input as Record<string, unknown>) || {},
        });
      }
    }

    const usage = response.usage
      ? {
          promptTokens: Number(response.usage.inputTokens || 0),
          completionTokens: Number(response.usage.outputTokens || 0),
          totalTokens: Number(response.usage.totalTokens || 0),
        }
      : undefined;

    return {
      text,
      toolCalls,
      model,
      raw: response,
      usage,
    };
  }
}

export function getLlmProvider(): LlmProvider {
  const provider = (process.env.LLM_PROVIDER || 'openai').toLowerCase().trim();
  if (provider === 'bedrock') {
    return new BedrockProvider();
  }
  return new OpenAiProvider();
}
