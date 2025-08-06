#!/bin/bash

# 安全聊天应用部署脚本
# 此脚本用于帮助部署前端应用到GitHub Pages

# 检查是否已安装Node.js
echo "检查Node.js是否已安装..."
if ! command -v node &> /dev/null
then
    echo "错误: 未找到Node.js。请先安装Node.js (v14+)。"
    exit 1
fi

# 进入前端目录
echo "进入前端目录..."
cd frontend || {
    echo "错误: 无法进入frontend目录。请确保此脚本在项目根目录运行。"
    exit 1
}

# 检查package.json中的homepage字段
echo "检查homepage配置..."
if ! grep -q '"homepage": "\."' package.json
then
    echo "警告: package.json中的homepage字段未设置为"."。"
    echo "正在更新homepage字段..."
    sed -i 's/"homepage":.*$/"homepage": ".",/' package.json
    echo "homepage字段已更新。"
fi

# 安装依赖
echo "安装依赖..."
npm install || {
    echo "错误: 安装依赖失败。"
    exit 1
}

# 安装gh-pages依赖
echo "安装gh-pages依赖..."
npm install --save-dev gh-pages || {
    echo "错误: 安装gh-pages依赖失败。"
    exit 1
}

# 提示用户更新API地址
echo "\n重要提示: 请确保已更新frontend/src/config.js中的apiUrl为部署后的后端地址。"
echo "如果尚未更新，请按Ctrl+C取消部署，更新后再运行此脚本。"
read -p "是否继续部署? (y/n): " continue
if [ "$continue" != "y" ] && [ "$continue" != "Y" ]
then
    echo "部署已取消。"
    exit 0
fi

# 构建应用
echo "构建应用..."
npm run build || {
    echo "错误: 构建应用失败。"
    exit 1
}

# 部署应用
echo "部署应用到GitHub Pages..."
npm run deploy || {
    echo "错误: 部署应用失败。"
    exit 1
}

# 提示部署完成
echo "\n部署完成！你的应用应该已经部署到GitHub Pages。"
echo "请访问 https://<your-username>.github.io/<repository-name> 查看。"

echo "请确保在GitHub上配置了Pages设置:"
echo "1. 进入仓库设置"
echo "2. 点击'Pages'"
echo "3. 在'Source'部分选择'gh-pages'分支和'/(root)'目录"
echo "4. 点击'Save'"

echo "如果尚未部署后端，请参考DEPLOYMENT_GUIDE.md文档部署后端服务。"

echo "部署脚本执行完毕。"