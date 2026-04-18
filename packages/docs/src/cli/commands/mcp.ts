import type { Command } from "cac";
import { withConfigFlag } from "@pagesmith/core/cli-kit";
import { startDocsMcpServer } from "../../mcp/server.js";

type McpOpts = {
  config?: string;
  root?: string;
  stdio?: boolean;
};

export function registerMcpCommand(command: Command): Command {
  return withConfigFlag(command)
    .option("--root <path>", "Project root to resolve config/content paths")
    .option("--stdio", "Use stdio transport (default)")
    .action(async (options: McpOpts) => {
      await startDocsMcpServer({
        configPath: options.config,
        rootDir: options.root,
      });
    });
}
