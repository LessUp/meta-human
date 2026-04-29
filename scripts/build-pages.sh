#!/bin/bash
set -e

echo "🔨 Building MetaHuman Engine for GitHub Pages..."

# 注意: build:pages 已在 package.json 中调用了 tsc && vite build --mode pages
# 此脚本作为 post-build 步骤执行

# 确保 docs 目录结构复制到 dist
echo "📚 Setting up documentation..."
mkdir -p dist/docs
cp -r docs/guide dist/docs/ 2>/dev/null || true
cp -r docs/api dist/docs/ 2>/dev/null || true
cp -r docs/architecture dist/docs/ 2>/dev/null || true

echo "✅ Build complete! Pages ready at dist/"
