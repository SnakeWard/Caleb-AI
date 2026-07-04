export class CliError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CliError";
  }
}

export class CliParseError extends CliError {
  constructor(message: string) {
    super(message);
    this.name = "CliParseError";
  }
}

export class CliInputError extends CliError {
  constructor(message: string) {
    super(message);
    this.name = "CliInputError";
  }
}

export class CliCommandError extends CliError {
  constructor(message: string) {
    super(message);
    this.name = "CliCommandError";
  }
}
