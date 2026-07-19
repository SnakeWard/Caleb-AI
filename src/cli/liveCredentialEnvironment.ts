const CREDENTIAL_SHAPED_ENV_NAME = /(?:^|_)(?:API_?KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL)(?:$|_)/i;

export function countUndeclaredCredentialShapedEnvironmentNames(
  declaredNames: ReadonlySet<string>
): number {
  return Object.keys(process.env).filter(
    (name) => CREDENTIAL_SHAPED_ENV_NAME.test(name) && !declaredNames.has(name)
  ).length;
}

export function unsetDeclaredEnvironmentNames(declaredNames: ReadonlySet<string>): void {
  for (const name of declaredNames) {
    delete process.env[name];
  }
}
