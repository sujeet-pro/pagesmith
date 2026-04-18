export class LoaderError extends Error {
  readonly filePath: string;
  readonly format: string;
  readonly line?: number;
  readonly column?: number;

  constructor(message: string, filePath: string, format: string, line?: number, column?: number) {
    super(`${format} parse error in ${filePath}${line ? `:${line}` : ""}: ${message}`);
    this.name = "LoaderError";
    this.filePath = filePath;
    this.format = format;
    this.line = line;
    this.column = column;
  }
}
