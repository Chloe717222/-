import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** 若默认 CSV 被本机占用（EBUSY），则写入此备用路径并在控制台提示改 index 的 BLESSINGS_CSV_URL */
const csvPath = path.join(__dirname, "..", "content", "blessings-test-five-plates.csv");
const csvFallback = path.join(__dirname, "..", "content", ".content-import001-rewrite-tmp.csv");

function parseCSVLine(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && i + 1 < line.length && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQ = !inQ;
      }
    } else if (c === "," && !inQ) {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

function escapeCell(s) {
  const t = String(s ?? "");
  if (/[",\r\n]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
  return t;
}

const raw = fs.readFileSync(csvPath, "utf8").replace(/^\uFEFF/, "");
const lines = raw.split(/\r?\n/).filter((ln) => ln.replace(/\s/g, "").length);
if (lines.length < 2) {
  console.error("CSV empty");
  process.exit(1);
}

const header = parseCSVLine(lines[0]);
const idxScene = header.findIndex((h) => String(h || "").replace(/\s+/g, "") === "场景");
const idxId = header.findIndex((h) => String(h || "").replace(/\s+/g, "") === "编号");
if (idxScene < 0 || idxId < 0) {
  console.error("Need 场景 and 编号 columns", header);
  process.exit(1);
}

const outLines = [lines[0]];
for (let r = 1; r < lines.length; r++) {
  const parts = parseCSVLine(lines[r]);
  if (parts.length < 2) continue;
  const id = parseInt(parts[idxId], 10);
  if (isNaN(id) || id < 1) continue;
  const letter = String.fromCharCode(65 + Math.floor((id - 1) / 100));
  parts[idxScene] = letter;
  outLines.push(parts.map(escapeCell).join(","));
}

const body = outLines.join("\n") + "\n";
try {
  fs.writeFileSync(csvPath, body, "utf8");
  console.log("Updated:", path.relative(process.cwd(), csvPath));
} catch (e) {
  if (e && (e.code === "EBUSY" || e.code === "EPERM")) {
    fs.writeFileSync(csvFallback, body, "utf8");
    console.warn("原 CSV 被占用，已写入:", path.relative(process.cwd(), csvFallback));
    console.warn("请关闭占用后将临时文件内容覆盖回主 CSV。");
  } else {
    throw e;
  }
}
console.log("场景列已按编号改为 A–E（1–100→A … 401–500→E，超出会继续顺延）。");
