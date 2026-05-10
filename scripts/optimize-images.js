/**
 * 图片压缩脚本 - V2.1 Phase 1
 *
 * 功能:
 * - 批量压缩 assets/photography/ 下的所有图片
 * - 生成渐进式 JPEG 优化版本到 assets/photography-opt/
 * - 保留原图用于 lightbox 高清显示
 * - 压缩目标: 78MB → 15MB (缩减 81%)
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  inputDir: 'assets/photography',
  outputDir: 'assets/photography-opt',
  quality: 82,              // 高质量 JPEG
  maxWidth: 2400,           // 最大宽度
  maxHeight: 1600,          // 最大高度
  progressive: true,        // 渐进式 JPEG
  mozjpeg: true            // 使用 mozjpeg 优化
};

// 统计信息
const stats = {
  total: 0,
  success: 0,
  failed: 0,
  originalSize: 0,
  optimizedSize: 0
};

/**
 * 递归获取目录下所有图片文件
 */
function getImageFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getImageFiles(filePath, fileList);
    } else if (/\.(jpg|jpeg|png)$/i.test(file)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * 压缩单张图片
 */
async function optimizeImage(inputPath, outputPath) {
  try {
    // 获取原始文件大小
    const originalSize = fs.statSync(inputPath).size;
    stats.originalSize += originalSize;

    // 确保输出目录存在
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 压缩图片
    await sharp(inputPath)
      .jpeg({
        quality: CONFIG.quality,
        progressive: CONFIG.progressive,
        mozjpeg: CONFIG.mozjpeg
      })
      .resize(CONFIG.maxWidth, CONFIG.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .toFile(outputPath);

    // 获取压缩后文件大小
    const optimizedSize = fs.statSync(outputPath).size;
    stats.optimizedSize += optimizedSize;

    // 计算压缩率
    const ratio = ((1 - optimizedSize / originalSize) * 100).toFixed(1);

    console.log(`✓ ${path.basename(inputPath)}`);
    console.log(`  ${formatSize(originalSize)} → ${formatSize(optimizedSize)} (${ratio}% 缩减)`);

    stats.success++;
  } catch (error) {
    console.error(`✗ ${path.basename(inputPath)}: ${error.message}`);
    stats.failed++;
  }
}

/**
 * 格式化文件大小
 */
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * 主函数
 */
async function main() {
  console.log('🖼️  图片压缩优化 - V2.1 Phase 1\n');
  console.log(`输入目录: ${CONFIG.inputDir}`);
  console.log(`输出目录: ${CONFIG.outputDir}`);
  console.log(`压缩质量: ${CONFIG.quality}`);
  console.log(`最大尺寸: ${CONFIG.maxWidth}x${CONFIG.maxHeight}\n`);

  // 获取所有图片文件
  const imageFiles = getImageFiles(CONFIG.inputDir);
  stats.total = imageFiles.length;

  if (stats.total === 0) {
    console.log('❌ 未找到图片文件');
    return;
  }

  console.log(`找到 ${stats.total} 张图片,开始压缩...\n`);

  // 批量压缩
  for (const inputPath of imageFiles) {
    const relativePath = path.relative(CONFIG.inputDir, inputPath);
    const outputPath = path.join(CONFIG.outputDir, relativePath);

    await optimizeImage(inputPath, outputPath);
  }

  // 输出统计信息
  console.log('\n📊 压缩完成统计:');
  console.log(`总计: ${stats.total} 张`);
  console.log(`成功: ${stats.success} 张`);
  console.log(`失败: ${stats.failed} 张`);
  console.log(`原始大小: ${formatSize(stats.originalSize)}`);
  console.log(`压缩后: ${formatSize(stats.optimizedSize)}`);

  const totalRatio = ((1 - stats.optimizedSize / stats.originalSize) * 100).toFixed(1);
  console.log(`总压缩率: ${totalRatio}%`);

  if (stats.optimizedSize < 20 * 1024 * 1024) {
    console.log('\n✅ 压缩目标达成 (< 20MB)');
  } else {
    console.log('\n⚠️  压缩后仍超过 20MB,建议进一步优化');
  }
}

// 执行
main().catch(console.error);
