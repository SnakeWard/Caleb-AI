export class ReportBuildError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReportBuildError";
  }
}

export class ReportRenderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReportRenderError";
  }
}

export class ReportWriteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReportWriteError";
  }
}

export class ReportParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReportParseError";
  }
}

export class ReportPathSafetyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReportPathSafetyError";
  }
}
