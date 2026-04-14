import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const mainCsvPath = path.join(repoRoot, "content", "blessings-test-five-plates.csv");
const scene5CsvPath = path.join(repoRoot, "content", "scene5-capsules.csv");
const manifestPath = path.join(repoRoot, "content", "blessings-manifest.json");

/** 单一配置源：改这里即可同步主 CSV + scene5 CSV + manifest */
const PLAN = {
  version: "2026-04-14-ux-s123-20-s4-100",
  sceneCounts: { 1: 20, 2: 20, 3: 20, 4: 100 },
  scene5Pairs: 20,
};

function esc(v) {
  const s = String(v ?? "");
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows) {
  return rows.map((r) => r.map(esc).join(",")).join("\n") + "\n";
}

function writeMainCsv() {
  const rows = [["场景", "编号", "文案", "图片url", "音频url", "视频url", "用户id"]];
  const defs = [
    { sid: 1, letter: "A", idBase: 0, text: "【板块1体验】祝福 %IDX%：愿你每天都被温柔接住。", uid: "u_test_A%IDX%" },
    { sid: 2, letter: "B", idBase: 100, text: "【板块2体验】祝福 %IDX%：愿你一路都有好风景。", uid: "u_test_B%ID%" },
    { sid: 3, letter: "C", idBase: 200, text: "【板块3体验】祝福 %IDX%：愿你所想都能慢慢实现。", uid: "u_test_C%ID%" },
    { sid: 4, letter: "D", idBase: 300, text: "【板块4体验】流星愿望 %IDX%：愿你今晚有星光，明天有好事。", uid: "u_test_D%ID%" },
  ];
  for (const d of defs) {
    const count = Number(PLAN.sceneCounts[d.sid] || 0);
    for (let i = 1; i <= count; i++) {
      const id = d.idBase + i;
      const idx = String(i).padStart(3, "0");
      rows.push([
        d.letter,
        String(id),
        d.text.replace("%IDX%", idx),
        "",
        "",
        "",
        d.uid.replace("%IDX%", idx).replace("%ID%", String(id)),
      ]);
    }
  }
  fs.writeFileSync(mainCsvPath, "\uFEFF" + toCsv(rows), "utf8");
}

function writeScene5Csv() {
  const rows = [["用户id", "给40岁的刘恋", "给40岁的自己"]];
  for (let i = 1; i <= PLAN.scene5Pairs; i++) {
    const idx = String(i).padStart(3, "0");
    const uid = `u_test_E${400 + i}`;
    rows.push([
      uid,
      `给40岁的刘恋（${idx}）：愿你依旧热烈，也依旧从容。`,
      `给40岁的自己（${idx}）：愿我仍保有勇气，去爱去闯去生活。`,
    ]);
  }
  fs.writeFileSync(scene5CsvPath, "\uFEFF" + toCsv(rows), "utf8");
}

function writeManifest() {
  const out = {
    version: PLAN.version,
    sceneCounts: {
      "1": PLAN.sceneCounts[1],
      "2": PLAN.sceneCounts[2],
      "3": PLAN.sceneCounts[3],
      "4": PLAN.sceneCounts[4],
    },
    scene5ExpectedPairs: PLAN.scene5Pairs,
  };
  fs.writeFileSync(manifestPath, JSON.stringify(out, null, 2) + "\n", "utf8");
}

writeMainCsv();
writeScene5Csv();
writeManifest();
console.log("synced datasets from single PLAN source");
