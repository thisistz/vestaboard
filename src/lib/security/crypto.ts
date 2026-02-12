import crypto from "node:crypto";
import { env, requireEnv } from "@/lib/security/env";

const IV_LENGTH = 12;

type EncryptedPayload = {
  iv: string;
  tag: string;
  value: string;
};

function getCipherKey(): Buffer {
  const raw = requireEnv(env.encryptionKey, "ENCRYPTION_KEY");
  return crypto.createHash("sha256").update(raw).digest();
}

export function encryptText(plainText: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-gcm", getCipherKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  const payload: EncryptedPayload = {
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    value: encrypted.toString("base64")
  };

  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

export function decryptText(encryptedText: string): string {
  const decoded = Buffer.from(encryptedText, "base64").toString("utf8");
  const payload = JSON.parse(decoded) as EncryptedPayload;
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getCipherKey(),
    Buffer.from(payload.iv, "base64")
  );

  decipher.setAuthTag(Buffer.from(payload.tag, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.value, "base64")),
    decipher.final()
  ]);

  return decrypted.toString("utf8");
}
