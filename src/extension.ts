import { Ollama, Message } from "ollama";
import * as vscode from "vscode";

const AGENT_PARTICIPANT_ID = "dev.wassim.agents.deepseek";
const BASE_PROMPT = `You are a helpful assistant.`;
const OLLAMA_HOST = "http://localhost:11434";
const MODEL = "deepseek-coder:1.3b";
const HIDDEN_ERROR_MESSAGE_PLACEHOLDER = "&nbsp;";

interface IAgentChatResult extends vscode.ChatResult {
  metadata: {
    command: string;
  };
}

const logger = vscode.env.createTelemetryLogger({
  sendEventData(eventName, data) {
    // Capture event telemetry
    console.log(`Event: ${eventName}`);
    console.log(`Data: ${JSON.stringify(data)}`);
  },
  sendErrorData(error, data) {
    // Capture error telemetry
    console.error(`Error: ${error}`);
    console.error(`Data: ${JSON.stringify(data)}`);
  },
});

export async function assertOllamaRunning(ollama: Ollama, stream: vscode.ChatResponseStream) {
  await ollama.ps();
}

async function assertPullModel(
  ollama: Ollama,
  model: string,
  stream: vscode.ChatResponseStream
) {
  const { models } = await ollama.list();
  if (!models.map((m) => m.name).filter((m) => m.startsWith(model)).length) {
    stream.progress(`Model ${model} not found.\n`);
    stream.progress(`Installing model.\n`);
    stream.progress(`This might take a few minutes.\n`);
    await pullModel(ollama, model, stream);
  }
}

async function pullModel(ollama: Ollama, model: string, stream: vscode.ChatResponseStream) {
  console.log(`Pulling latest model ${model}'s manifest...`);
  let currentDigestDone = false;

  const response = await ollama.pull({ model: model, stream: true });
  for await (const part of response) {
    if (part.digest) {
      let percent = 0;
      if (part.completed && part.total) {
        percent = Math.round((part.completed / part.total) * 100);
      }
      process.stdout.write(`${part.status} ${percent}%...`); // Write the new text
      if (percent === 100 && !currentDigestDone) {
        console.log(); // Output to a new line
        currentDigestDone = true;
      } else {
        currentDigestDone = false;
      }
    } else {
      stream.progress(`${part.status}...\n`);
      console.log(part.status);
    }
  }

  stream.progress("Download complete!\n");
  console.log("Download complete!");
}

function readModelFromConfig() {
  const workbenchConfig = vscode.workspace.getConfiguration("deepseek");
  return (workbenchConfig.get("model.name") ?? MODEL) as string;
}

function readOllamaHostFromConfig() {
  const workbenchConfig = vscode.workspace.getConfiguration("deepseek");
  return (workbenchConfig.get("ollama.host") ?? OLLAMA_HOST) as string;
}

// To talk to an LLM in your subcommand handler implementation, your
// extension can use VS Code's `requestChatAccess` API to access the Copilot API.
// The GitHub Copilot Chat extension implements this provider.
async function agentHandler(
  request: vscode.ChatRequest,
  context: vscode.ChatContext,
  stream: vscode.ChatResponseStream
): Promise<IAgentChatResult> {
  try {
    const tools = await getTools();
    const model = readModelFromConfig();
    const ollama = new Ollama({ host: readOllamaHostFromConfig() });

    await assertOllamaRunning(ollama, stream);
    await assertPullModel(ollama, model, stream);

    const messages = [
      {
        role: "user",
        content: BASE_PROMPT,
      },
      ...appendAssistantHistory(context),
      {
        role: "user",
        content: request.prompt,
      },
    ];

    const chatResponse = await streamResponse(ollama, model, messages, tools);
    for await (const fragment of chatResponse) {
      // Process the output from the language model
      stream.markdown(fragment.message.content);
    }
  } catch (err) {
    handleError(logger, err, stream);
  }

  return { metadata: { command: "" } };
}

function handleError(
  logger: vscode.TelemetryLogger,
  err: any,
  stream: vscode.ChatResponseStream
): void {
  // making the chat request might fail because
  // - model does not exist
  // - user consent not given
  // - quote limits exceeded
  logger.logError(err);
  console.log({err});

  if (err.code === "ERR_INVALID_URL" || err.cause?.code === "ECONNREFUSED") {
    const host = readOllamaHostFromConfig();
    stream.markdown(
      vscode.l10n.t(
        // we use a placeholder to identify error messages
        // this placeholder will be ignored by markdown rendering
        HIDDEN_ERROR_MESSAGE_PLACEHOLDER+"I'm sorry, I cannot connect to the Ollama server.\n\n"+
        "Please check the following:\n\n"+
        `- The Ollama app is installed and running. Visit [ollama.com](https://ollama.com) for more details.\n`+
        `- The Ollama server is running at [${host}](${host})\n`+
        "- The Ollama server URL is correct in your [settings.json](https://code.visualstudio.com/docs/getstarted/settings): `deepseek.ollama.host` \n"+
        "- The Ollama server is accessible from this network.\n\n"+
        `Here is the error message: \`${err.message} (code: ${(err.code || err.cause?.code) || 'UNKNOWN'})\``
      )
    );
  }
  else {
    stream.markdown(
      vscode.l10n.t(
        "I'm sorry, I can't help with that. Can I help with something else?"
      )
    );
  }

}

function appendAssistantHistory(context: vscode.ChatContext) {
  const messages: any[] = [];
  // add the previous messages to the messages array
  context.history.forEach((m) => {
    let fullMessage = "";

    if (m instanceof vscode.ChatResponseTurn) {
      m.response.forEach((r) => {
        const mdPart = r as vscode.ChatResponseMarkdownPart;
        const {value} = mdPart.value;

        // skip error messages
        if (!value.startsWith(HIDDEN_ERROR_MESSAGE_PLACEHOLDER)) {
          fullMessage += value;
        }
      });

      if (fullMessage) {
        messages.push({
          role: "assistant",
          content: fullMessage,
        });
      }
    } else if (m instanceof vscode.ChatRequestTurn) {
      messages.push({
        role: "user",
        content: m.prompt,
      });
    }
  });

  return messages;
}

async function* streamResponse(ollama: Ollama, model: string, messages: Message[], tools: any) {
  try {
    console.log("Using model:", model);
    console.log(`${readOllamaHostFromConfig()}/api/chat`);
    console.log({ messages });
    console.log({ tools });

    const response = await ollama.chat({
      model,
      messages,
      
      // TODO: enable function calls when DeepSeek supports it
      // tools,

      stream: true,
    });

    for await (const chunk of response) {
      yield chunk;
    }
  } catch (err: any) {
    console.error(err.message);
  }
}

async function registerParticipant(context: vscode.ExtensionContext) {
  const agent = vscode.chat.createChatParticipant(
    AGENT_PARTICIPANT_ID,
    agentHandler
  );
  agent.iconPath = vscode.Uri.joinPath(context.extensionUri, "deepseek.png");

  context.subscriptions.push(
    agent.onDidReceiveFeedback((feedback: vscode.ChatResultFeedback) => {
      logger.logUsage("chatResultFeedback", {
        kind: feedback.kind,
      });
    })
  );
}

async function getTools() {
  const tools = vscode.lm.tools.map(
    (tool: vscode.LanguageModelToolInformation) => {
      return {
        type: "function",
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema,
        },
      };
    }
  );
  return tools;
}

export function activate(context: vscode.ExtensionContext) {
  registerParticipant(context);
}

// This method is called when your extension is deactivated
export function deactivate() {}
