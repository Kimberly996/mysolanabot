# Solana代币转账监控脚本

这个脚本可以实时监控Solana网络上的代币转账事件。

## 安装依赖

```bash
npm install
```

## 环境配置

1. 复制 `.env.example` 到 `.env`：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，配置需要监控的代币：
```env
# Solana RPC地址
RPC_URL=https://api.mainnet-beta.solana.com

# 需要监控的代币 (用逗号分隔)
MONITOR_TOKENS=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v,Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB

# 监控所有代币
MONITOR_ALL_TOKENS=false
```

## 使用方法

### 1. 使用环境变量配置监控
```bash
npm run monitor
```

### 2. 监控特定代币（覆盖环境变量）
```bash
npm run monitor EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

### 3. 在代码中使用

```javascript
const SolanaTokenMonitor = require('./token-monitor');

const monitor = new SolanaTokenMonitor();

// 自定义转账处理函数
const customHandler = (transfer, context) => {
    console.log('检测到转账:', transfer);
    // 在这里添加你的业务逻辑
};

// 监控特定代币
monitor.monitorSpecificToken('TOKEN_MINT_ADDRESS', customHandler);

// 或监控所有代币
monitor.monitorAllTokens(customHandler);
```

## 功能特性

- ✅ 实时监控代币转账事件
- ✅ 支持监控特定代币或所有代币
- ✅ 自动重连机制
- ✅ 详细的转账信息解析
- ✅ 可自定义事件处理函数
- ✅ 支持主网、测试网和开发网

## 监控信息包括

- 交易签名
- 代币地址
- 账户地址
- 转账数量
- 转账类型（发送/接收）
- 时间戳
- 区块高度

## 注意事项

1. 需要稳定的网络连接
2. 监控大量交易可能消耗较多资源
3. 可以通过Ctrl+C停止监控