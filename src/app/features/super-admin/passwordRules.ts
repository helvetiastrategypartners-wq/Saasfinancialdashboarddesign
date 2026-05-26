export const PASSWORD_RULES = [
  "12 caracteres minimum",
  "une minuscule",
  "une majuscule",
  "un chiffre",
  "un caractere special",
];

export function getPasswordIssues(password: string) {
  const issues = [];
  if (password.length < 12) issues.push(PASSWORD_RULES[0]);
  if (!/[a-z]/.test(password)) issues.push(PASSWORD_RULES[1]);
  if (!/[A-Z]/.test(password)) issues.push(PASSWORD_RULES[2]);
  if (!/\d/.test(password)) issues.push(PASSWORD_RULES[3]);
  if (!/[^A-Za-z0-9]/.test(password)) issues.push(PASSWORD_RULES[4]);
  return issues;
}

