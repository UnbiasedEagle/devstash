interface EmailContent {
  heading: string;
  intro: string;
  buttonLabel: string;
  url: string;
  footer: string;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderEmail({ heading, intro, buttonLabel, url, footer }: EmailContent) {
  const safeUrl = escapeHtml(url);

  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #111;">
  <h1 style="font-size: 20px; margin: 0 0 16px;">${heading}</h1>
  <p style="font-size: 15px; line-height: 1.5; margin: 0 0 24px;">${intro}</p>
  <a href="${safeUrl}" style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-size: 15px;">${buttonLabel}</a>
  <p style="font-size: 13px; line-height: 1.5; color: #555; margin: 24px 0 0;">Button not working? Paste this link into your browser:<br />${safeUrl}</p>
  <p style="font-size: 13px; color: #555; margin: 16px 0 0;">${footer}</p>
</div>`;
}

export function verificationEmail(name: string, url: string) {
  return {
    subject: "Verify your DevStash email",
    html: renderEmail({
      heading: "Confirm your email",
      intro: `Hi ${escapeHtml(name)}, confirm your email address to start using your DevStash account.`,
      buttonLabel: "Verify email",
      url,
      footer: "If you didn't create a DevStash account, you can ignore this email.",
    }),
  };
}

export function existingAccountEmail(name: string, signInUrl: string) {
  return {
    subject: "You already have a DevStash account",
    html: renderEmail({
      heading: "You already have an account",
      intro: `Hi ${escapeHtml(name)}, someone tried to sign up for DevStash with this email address, but you already have an account.`,
      buttonLabel: "Sign in",
      url: signInUrl,
      footer: "If this wasn't you, you can ignore this email.",
    }),
  };
}
