#!/bin/bash
set -e

echo "🔨 Building MetaHuman Engine for GitHub Pages..."

# 注意: build:pages 已在 package.json 中调用了 tsc && vite build --mode pages
# 此脚本作为 post-build 步骤执行

# 注入构建时间戳
BUILD_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "📅 Build timestamp: $BUILD_TIMESTAMP"

# 构建 VitePress 文档站点
echo "📚 Building documentation with VitePress..."
export VITEPRESS_BASE="/meta-human/"
npm run docs:build

# 将 VitePress 构建输出移动到 dist/docs/
if [ -d "docs/.vitepress/dist" ]; then
  echo "📦 Moving docs to dist/docs/..."
  rm -rf dist/docs
  mv docs/.vitepress/dist dist/docs
fi

# 添加 .nojekyll 文件（禁用 Jekyll 处理）
touch dist/.nojekyll
touch dist/docs/.nojekyll

# 生成简单的 sitemap.xml
echo "🗺️  Generating sitemap..."
cat > dist/sitemap.xml << EOF
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://lessup.github.io/meta-human/</loc>
    <lastmod>${BUILD_TIMESTAMP}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://lessup.github.io/meta-human/docs/</loc>
    <lastmod>${BUILD_TIMESTAMP}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
EOF

echo "✅ Build complete! Pages ready at dist/"
echo "📊 Bundle size: $(du -sh dist/ | cut -f1)"
