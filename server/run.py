"""MetaHuman 后端服务启动入口

使用方式:
    python run.py                  # 默认 localhost:8000
    python run.py --port 8080      # 指定端口
    python run.py --reload         # 开发模式（热重载）
"""
import argparse
import os

import uvicorn


def main() -> None:
    parser = argparse.ArgumentParser(description="MetaHuman 后端服务")
    parser.add_argument("--host", default="0.0.0.0", help="监听地址（默认: 0.0.0.0）")
    parser.add_argument("--port", type=int, default=8000, help="监听端口（默认: 8000）")
    parser.add_argument("--reload", action="store_true", help="开启热重载（开发模式）")
    args = parser.parse_args()

    # 自动加载 .env 文件
    try:
        from dotenv import load_dotenv
        env_path = os.path.join(os.path.dirname(__file__), ".env")
        if os.path.exists(env_path):
            load_dotenv(env_path)
            print(f"已加载环境变量: {env_path}")
    except ImportError:
        pass

    uvicorn.run(
        "app.main:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
    )


if __name__ == "__main__":
    main()
