#!/usr/bin/env node
// `npm run check` — vibe coder'ların en sık yaptığı 7 hatayı otomatik yakalar:
//   1. RLS açılmamış migration tablosu
//   2. service_role key'in client kodunda geçmesi
//   3. .env dosyasının git'e commit edilmiş olması
//   4. Server action'larda self-fetch anti-pattern (actions → fetch(/api/...))
//   5. API route GET handler'ında auth kontrolü eksik
//   6. dangerouslySetInnerHTML kullanımı
//   7. npm audit (güncel CVE'ler)
//
// Sıfır bağımlılıkla çalışır (node fs/path yeterli) — kurulum gerektirmez.

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
let errorCount = 0;

function walk(dir, exts, exclude = ["node_modules", ".next", ".git"]) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    if (exclude.includes(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...walk(full, exts, exclude));
    } else if (exts.includes(extname(entry))) {
      results.push(full);
    }
  }
  return results;
}

console.log("🔍 VibeSaaS güvenlik kontrolü başladı...\n");

// ── 1. RLS kontrolü ──────────────────────────────────────────
const migrationsDir = join(root, "supabase", "migrations");
if (existsSync(migrationsDir)) {
  const sqlFiles = walk(migrationsDir, [".sql"], []);
  for (const file of sqlFiles) {
    const content = readFileSync(file, "utf-8");
    const createTableMatches = [
      ...content.matchAll(/create table\s+(?:public\.)?(\w+)/gi),
    ];
    for (const match of createTableMatches) {
      const tableName = match[1];
      const rlsPattern = new RegExp(
        `alter table\\s+(?:public\\.)?${tableName}\\s+enable row level security`,
        "i"
      );
      if (!rlsPattern.test(content)) {
        console.error(
          `❌ RLS eksik: "${tableName}" tablosu ${file} içinde oluşturulmuş ama RLS açılmamış.`
        );
        console.error(
          `   Ekle: alter table public.${tableName} enable row level security;\n`
        );
        errorCount++;
      }
    }
  }
} else {
  console.log("⚠️  supabase/migrations klasörü bulunamadı, RLS kontrolü atlandı.");
}

// ── 2. service_role key sızıntısı kontrolü ──────────────────
const codeFiles = walk(root, [".ts", ".tsx"], [
  "node_modules", ".next", ".git", "scripts",
]);
for (const file of codeFiles) {
  const content = readFileSync(file, "utf-8");
  const usesServiceRole = content.includes("SUPABASE_SERVICE_ROLE_KEY");
  const isClientComponent = /^["']use client["']/m.test(content);
  if (usesServiceRole && isClientComponent) {
    console.error(
      `❌ KRİTİK: ${file} bir "use client" dosyası ama SUPABASE_SERVICE_ROLE_KEY kullanıyor.`
    );
    console.error(
      "   Bu key client bundle'ına sızabilir ve TÜM tenant'ların verisini tehlikeye atar.\n"
    );
    errorCount++;
  }
}

// ── 3. .env commit kontrolü ──────────────────────────────────
const gitignorePath = join(root, ".gitignore");
if (existsSync(gitignorePath)) {
  const gitignore = readFileSync(gitignorePath, "utf-8");
  if (!gitignore.includes(".env.local") && !gitignore.includes(".env*")) {
    console.error(
      "❌ .gitignore içinde .env.local yok — secret key'lerin git'e commit edilme riski var.\n"
    );
    errorCount++;
  }
} else {
  console.error("❌ .gitignore dosyası bulunamadı.\n");
  errorCount++;
}

// ── 4. Server action'da self-fetch (actions → /api/...) kontrolü ──
const actionFiles = walk(root, [".ts"], [
  "node_modules", ".next", ".git",
]);
for (const file of actionFiles) {
  // Only check files that have "use server"
  const content = readFileSync(file, "utf-8");
  if (!/^["']use server["']/m.test(content)) continue;
  // Match fetches to /api/ that are relative or use localhost / SITE_URL
  const selfFetchPattern = /fetch\([`"'](\/api\/|http:\/\/localhost:\d+\/api|https?:\/\/[^`"']*\/api)/i;
  if (selfFetchPattern.test(content)) {
    console.error(
      `❌ Self-fetch anti-pattern: ${file} bir server action ama /api/ yoluna fetch yapıyor.\n` +
      "   Server action'lar doğrudan lib/data/ veya supabase client'ı kullanmalı.\n" +
      "   Self-fetch ile cookie propagation çalışmaz (oturum bozulur).\n"
    );
    errorCount++;
  }
}

// ── 5. API route GET handler'ında auth kontrolü kontrolü ──────
const apiRouteFiles = walk(root, [".ts"], [
  "node_modules", ".next", ".git", "scripts",
]);
for (const file of apiRouteFiles) {
  // Only check files inside app/api/ that define GET exports
  if (!file.replace(/\\/g, "/").includes("/app/api/")) continue;
  const content = readFileSync(file, "utf-8");
  const hasGet = /\bexport\s+async\s+function\s+GET\b/.test(content);
  if (!hasGet) continue;
  const hasAuthCheck = content.includes(".auth.getUser()") || content.includes(".auth.getSession()");
  if (!hasAuthCheck) {
    console.error(
      `❌ Auth kontrolü eksik: ${file} bir GET export'u var ama getUser() kontrolü yapılmıyor.\n` +
      "   Unutma: RLS ikinci katmandır; API route kendi auth check'ini de yapmalı.\n"
    );
    errorCount++;
  }
}

// ── 6. dangerouslySetInnerHTML kontrolü ────────────────────
for (const file of codeFiles) {
  const content = readFileSync(file, "utf-8");
  if (content.includes("dangerouslySetInnerHTML")) {
    console.error(
      `⚠️  Uyarı: ${file} dosyası "dangerouslySetInnerHTML" kullanıyor.\n` +
      "   Kullanıcı verisi içeriyorsa XSS riski oluşturur. çok gerekli değilse React JSX kullan.\n"
    );
    errorCount++;
  }
}

// ── 7. npm audit ──────────────────────────────────────────────
try {
  const auditOutput = execSync("npm audit --audit-level=critical", {
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 30_000,
  });
  // If exit code is non-zero but we got here via try, audit found something
  console.error("❌ npm audit kritik güvenlik açığı buldu:\n" + auditOutput);
  errorCount++;
} catch (err) {
  // npm audit returns non-zero on findings; output is on stderr
  const stderr = err.stderr?.trim() ?? "";
  const stdout = err.stdout?.trim() ?? "";
  if (stderr || stdout) {
    const combined = stderr + "\n" + stdout;
    // If it just says "found 0 vulnerabilities" it's fine
    if (!combined.includes("0 vulnerabilities") && !combined.includes("found 0")) {
      console.error("❌ npm audit güvenlik açığı buldu:\n" + (stderr || stdout || "Bilinmeyen hata") + "\n");
      errorCount++;
    }
  }
}

// ── Sonuç ─────────────────────────────────────────────────────
console.log("─".repeat(50));
if (errorCount === 0) {
  console.log("✅ Kontrol temiz. Bilinen güvenlik hatası bulunamadı.");
  process.exit(0);
} else {
  console.log(`❌ ${errorCount} sorun bulundu. Yukarıdaki maddeleri düzelt.`);
  process.exit(1);
}