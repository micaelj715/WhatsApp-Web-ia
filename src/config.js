import path from "node:path";

const env = process.env;

export const config = {
  port: Number(env.PORT) || 3000,
  dataDir: path.resolve(env.DATA_DIR || env.RAILWAY_VOLUME_MOUNT_PATH || "./data"),
  publicUrl: (env.PUBLIC_URL || "").replace(/\/$/, ""),
  groqKey: (env.GROQ_API_KEY || "").trim().replace(/^["']|["']$/g, ""),
  groqModel: (env.GROQ_MODEL || "openai/gpt-oss-120b").trim(),
  groqFallbackModel: (env.GROQ_FALLBACK_MODEL || "openai/gpt-oss-20b").trim(),
  groqBaseUrl: (env.GROQ_BASE_URL || "https://api.groq.com/openai/v1").replace(/\/$/, ""),
  adminEmail: (env.ADMIN_EMAIL || "").trim().toLowerCase(),
  adminPassword: env.ADMIN_PASSWORD || "",
  paypalLink: (env.PAYPAL_LINK || "").trim().replace(/\/$/, ""),
  supportWhatsapp: (env.SUPPORT_WHATSAPP || "").replace(/\D/g, ""),
  trialDays: Number(env.TRIAL_DAYS) || 7,
  // Quantas conversas por vez a IA atende em paralelo (protege o limite grátis do Groq)
  aiConcurrency: Number(env.AI_CONCURRENCY) || 3,
};

// Os dados só sobrevivem a atualizações se estiverem num Volume do Railway
export function storageInfo() {
  const onRailway = !!(env.RAILWAY_ENVIRONMENT || env.RAILWAY_ENVIRONMENT_NAME || env.RAILWAY_PROJECT_ID);
  const mount = env.RAILWAY_VOLUME_MOUNT_PATH ? path.resolve(env.RAILWAY_VOLUME_MOUNT_PATH) : "";
  const persistent = !onRailway || (!!mount && (config.dataDir === mount || config.dataDir.startsWith(mount + path.sep)));
  return { persistent, dir: config.dataDir, volume: mount };
}

export function assertConfig(log) {
  const st = storageInfo();
  if (!st.persistent) log(`AVISO GRAVE: sem Volume. Os dados em ${st.dir} são APAGADOS a cada atualização. Crie um Volume montado em /data.`);
  if (!config.groqKey) log("AVISO: GROQ_API_KEY não definida. O atendente não vai conseguir responder.");
  if (!config.adminEmail || config.adminPassword.length < 8)
    log("AVISO: defina ADMIN_EMAIL e ADMIN_PASSWORD (mínimo 8 caracteres) para acessar /admin.");
  if (!config.paypalLink) log("AVISO: PAYPAL_LINK não definido. Os clientes não verão o botão de pagamento.");
}
