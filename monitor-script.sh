#!/bin/bash
# 监控脚本 - 检查后端服务状态和错误日志

OUTPUT_FILE="D:\Claude Code\Same\.claude\projects\D--Claude-Code-Same\monitor-output.txt"
TASK_ID_FILE="D:\Claude Code\Same\.claude\projects\D--Claude-Code-Same\.task-id"

# 读取任务 ID
if [ -f "$TASK_ID_FILE" ]; then
    TASK_ID=$(cat "$TASK_ID_FILE")
else
    TASK_ID="b0xra8brj"
fi

# 检查后台任务状态并获取输出
echo "=== 监控检查 $(date) ===" >> "$OUTPUT_FILE"

# 尝试获取任务输出（这里简化为检查进程）
if ps aux | grep -i "node.*index.js" | grep -v grep > /dev/null; then
    echo "[OK] 后端服务运行中" >> "$OUTPUT_FILE"
else
    echo "[ERROR] 后端服务已停止!" >> "$OUTPUT_FILE"
fi

echo "" >> "$OUTPUT_FILE"
