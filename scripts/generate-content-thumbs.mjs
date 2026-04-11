/**
 * 从 content/ 下四位编号原图批量生成 content/thumbs/{id}.webp（默认长边 384，可压画质换速度）。
 * 网页主视图格优先加载 thumbs，弹窗仍用原图 imageUrl，CSV 无需多一列（可选填「缩略图」覆盖路径）。
 *
 * 用法（在仓库根或 scripts 目录均可）：
 *   cd scripts && npm install && node generate-content-thumbs.mjs ../content
 *   node generate-content-thumbs.mjs ./content 320
 */
import fs from "fs";
import path from "path";
import sharp from "sharp";

const ID_RE = /^(\d{4})\.(jpe?g|png|webp|gif|bmp)$/i;

async function main() {
  const contentDir = path.resolve(process.argv[2] || "content");
  const maxSide = Math.min(2048, Math.max(64, Number(process.argv[3]) || 384));
  const force = process.argv.includes("--force");

  if (!fs.existsSync(contentDir) || !fs.statSync(contentDir).isDirectory()) {
    console.error("用法: node generate-content-thumbs.mjs <content 目录路径> [长边像素，默认384] [--force]");
    process.exit(1);
  }

  const outDir = path.join(contentDir, "thumbs");
  fs.mkdirSync(outDir, { recursive: true });

  const names = fs.readdirSync(contentDir, { withFileTypes: true });
  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (const ent of names) {
    if (!ent.isFile()) continue;
    const m = ID_RE.exec(ent.name);
    if (!m) continue;
    const id = m[1];
    const src = path.join(contentDir, ent.name);
    const dest = path.join(outDir, `${id}.webp`);
    if (!force && fs.existsSync(dest)) {
      skip += 1;
      continue;
    }
    try {
      await sharp(src)
        .rotate()
        .resize({
          width: maxSide,
          height: maxSide,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 78, effort: 4 })
        .toFile(dest);
      ok += 1;
      if (ok % 100 === 0) console.error(`…已写 ${ok} 张`);
    } catch (e) {
      fail += 1;
      console.error(`${id}: ${e && e.message ? e.message : e}`);
    }
  }

  console.error(`完成：新生成 ${ok}，跳过已存在 ${skip}，失败 ${fail}。输出目录: ${outDir}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
