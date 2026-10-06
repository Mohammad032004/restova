export interface PasswordSetupEmailData {
  ownerName: string;
  ownerEmail: string;
  setupUrl: string;
}

export async function sendPasswordSetupEmail({
  ownerName,
  ownerEmail,
  setupUrl,
}: PasswordSetupEmailData) {
  /*
   * Email provider will be connected here later.
   *
   * For development we only log the destination.
   * Do NOT log the password setup token in production.
   */

  console.log("Password setup email prepared.");
  console.log("Owner:", ownerName);
  console.log("Email:", ownerEmail);
  console.log("Setup URL:", setupUrl);

  return {
    success: true,
  };
}