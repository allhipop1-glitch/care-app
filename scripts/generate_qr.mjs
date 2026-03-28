#!/usr/bin/env node
/**
 * QR 코드 생성 스크립트 (중앙에 사고케어 로고 삽입)
 * Usage: node scripts/generate_qr.mjs "exps://..."
 */
import QRCode from "qrcode";
import { execSync } from "child_process";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url = process.argv[2];

if (!url) {
  console.error('Usage: node scripts/generate_qr.mjs "exps://..."');
  process.exit(1);
}

const qrPath = path.resolve(__dirname, "../expo-qr-code-raw.png");
const logoPath = path.resolve(__dirname, "../assets/images/sagocare_logo_transparent.png");
const outputPath = path.resolve(__dirname, "../expo-qr-code.png");

// 1) QR 코드 생성 (오류 수정 레벨 H — 로고로 30%까지 가려도 인식 가능)
await QRCode.toFile(qrPath, url, {
  width: 600,
  errorCorrectionLevel: "H",
  margin: 2,
  color: {
    dark: "#1A2B4C",
    light: "#FFFFFF",
  },
});
console.log("✅ QR 코드 생성 완료");

// 2) Python PIL로 로고를 중앙에 합성
if (!existsSync(logoPath)) {
  console.log("⚠️  로고 파일 없음 — 로고 없이 QR 코드만 저장됨");
  execSync(`cp "${qrPath}" "${outputPath}"`);
  console.log(`✅ QR code saved to expo-qr-code.png`);
  process.exit(0);
}

const pythonScript = `
from PIL import Image

qr = Image.open(r"${qrPath}").convert("RGBA")
logo = Image.open(r"${logoPath}").convert("RGBA")

qr_w, qr_h = qr.size

# 로고 크기: QR 코드의 22%
logo_size = int(qr_w * 0.22)
logo = logo.resize((logo_size, logo_size), Image.LANCZOS)

# 흰 배경 패딩 (로고 주변 여백)
pad = 10
bg = Image.new("RGBA", (logo_size + pad*2, logo_size + pad*2), (255, 255, 255, 255))
bg.paste(logo, (pad, pad), logo)

# 중앙 위치 계산
pos_x = (qr_w - bg.size[0]) // 2
pos_y = (qr_h - bg.size[1]) // 2

qr.paste(bg, (pos_x, pos_y), bg)
qr.convert("RGB").save(r"${outputPath}", "PNG", optimize=True)
print("로고 합성 완료")
`;

try {
  execSync(`python3 -c "${pythonScript.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`, { stdio: "inherit" });
  console.log(`✅ 로고가 삽입된 QR 코드 저장: expo-qr-code.png`);
} catch (e) {
  // fallback: 파이썬 스크립트를 파일로 저장 후 실행
  const { writeFileSync } = await import("fs");
  const tmpScript = path.resolve(__dirname, "../_tmp_qr_logo.py");
  writeFileSync(tmpScript, pythonScript);
  try {
    execSync(`python3 "${tmpScript}"`, { stdio: "inherit" });
    execSync(`rm "${tmpScript}"`);
    console.log(`✅ 로고가 삽입된 QR 코드 저장: expo-qr-code.png`);
  } catch (e2) {
    execSync(`cp "${qrPath}" "${outputPath}"`);
    console.log(`✅ QR code saved to expo-qr-code.png (로고 합성 실패, 기본 QR 저장)`);
  }
}
