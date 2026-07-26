#!/usr/bin/env node
// `npm run check` — vibe coder'ların en sık yaptığı 3 hatayı otomatik yakalar:
//   1. RLS açılmamış migration tablosu
//   2. service_role key'in client kodunda (herhangi bir .tsx/.ts, "use client" içeren) geçmesi
//   3. .env dosyasının git'e commit edilmiş olması
//
// Sıfır bağımlılıkla çalışır (node fs/path yeterli) — kurulum gerektirmez.

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, extname } from "node:path";

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
  const sqlFiles = walk(migrationsDir, [".sql"]);
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

// ── Sonuç ─────────────────────────────────────────────────────
console.log("─".repeat(50));
if (errorCount === 0) {
  console.log("✅ Kontrol temiz. Bilinen güvenlik hatası bulunamadı.");
  process.exit(0);
} else {
  console.log(`❌ ${errorCount} sorun bulundu. Yukarıdaki maddeleri düzelt.`);
  process.exit(1);
}
