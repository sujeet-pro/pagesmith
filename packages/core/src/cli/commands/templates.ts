import type { Command } from "cac";
import { listTemplates } from "../../create/index.js";
import { note } from "../../cli-kit/index.js";

export function registerTemplatesCommand(command: Command): Command {
  return command.action(() => {
    note(listTemplates(), "Available templates");
  });
}
