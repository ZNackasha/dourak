import nodemailer from "nodemailer";

/**
 * Builds a nodemailer transport from EMAIL_SERVER.
 *
 * Why not just `createTransport(process.env.EMAIL_SERVER)`? When a raw URL
 * string is passed, nodemailer derives `secure` solely from the scheme
 * (`smtps:` → true, `smtp:` → false) and ignores any `secure` override. That
 * breaks implicit-TLS ports: `smtp://…:465` connects with `secure=false` and
 * the handshake never completes ("Greeting never received"). We parse the URL
 * ourselves and force `secure=true` for the TLS-only ports (465/2465).
 *
 * With no EMAIL_SERVER configured we fall back to a JSON transport that just
 * logs the message (used in local dev).
 */
export function createEmailTransport(): nodemailer.Transporter {
  const server = process.env.EMAIL_SERVER;
  if (!server) {
    return nodemailer.createTransport({ jsonTransport: true });
  }

  try {
    const url = new URL(server);
    const port = Number(url.port) || (url.protocol === "smtps:" ? 465 : 587);
    const secure =
      url.protocol === "smtps:" || port === 465 || port === 2465;

    return nodemailer.createTransport({
      host: url.hostname,
      port,
      secure,
      auth: url.username
        ? {
            user: decodeURIComponent(url.username),
            pass: decodeURIComponent(url.password),
          }
        : undefined,
    });
  } catch {
    // Not a URL we can parse — let nodemailer try to interpret it as-is.
    return nodemailer.createTransport(server);
  }
}

export function emailFrom(): string {
  return process.env.EMAIL_FROM || "noreply@dourak.app";
}
