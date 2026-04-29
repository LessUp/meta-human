#!/bin/bash
set -e

echo "🔨 Building MetaHuman Engine for GitHub Pages..."

# 构建应用
npm run build -- --mode pages

# 将门户 HTML 复制到 dist 根目录
echo "📄 Adding portal landing page..."
cp docs/portal.html dist/index.html

# 确保 docs 目录结构完整
echo "📚 Setting up documentation..."
mkdir -p dist/docs
cp -r docs/guide dist/docs/ 2>/dev/null || true
cp -r docs/api dist/docs/ 2>/dev/null || true
cp -r docs/architecture dist/docs/ 2>/dev/null || true

echo "✅ Build complete! Pages ready at dist/"
