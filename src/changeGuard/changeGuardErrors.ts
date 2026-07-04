export class SnapshotValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SnapshotValidationError";
  }
}

export class SnapshotWriteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SnapshotWriteError";
  }
}

export class SnapshotReadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SnapshotReadError";
  }
}

export class RollbackSafetyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RollbackSafetyError";
  }
}

export class RollbackRestoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RollbackRestoreError";
  }
}

export class GuardCommandError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GuardCommandError";
  }
}

export class PathSafetyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PathSafetyError";
  }
}
