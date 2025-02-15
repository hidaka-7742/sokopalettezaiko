// Temporary mock auth until Firebase is integrated
export async function auth() {
  // For development, always return a mock session
  return { user: { email: "staff@warehouse.com" } };
}