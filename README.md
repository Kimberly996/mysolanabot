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

# 需要监控的钱包地址 (用逗号分隔)
MONITOR_ADDRESSES=7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU

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

### 3. 监控特定地址的所有交易
```bash
npm run monitor --address 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
```

### 4. 在代码中使用

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

// 监控特定地址的所有交易
monitor.monitorAddressTransactions('WALLET_ADDRESS', customTransactionHandler);
```

## 功能特性

- ✅ 实时监控代币转账事件
- ✅ 监控特定钱包地址的所有交易
- ✅ 支持监控特定代币或所有代币
- ✅ 自动重连机制
- ✅ 详细的转账信息解析
- ✅ 完整的交易信息（手续费、指令、状态等）
- ✅ 可自定义事件处理函数
- ✅ 支持主网、测试网和开发网

## 监控信息包括

### 代币转账监控
- 交易签名
- 代币地址
- 账户地址
- 转账数量
- 转账类型（发送/接收）
- 时间戳
- 区块高度

### 地址交易监控
- 交易签名和状态
- 交易手续费
- 指令数量和详情
- 代币转账记录
- 交易时间和区块
- 程序调用信息

## 常见代币地址

```env
# 主要稳定币
USDC=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
USDT=Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB

# 其他代币
SOL=So11111111111111111111111111111111111111112 (Wrapped SOL)
RAY=4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R (Raydium)
SRM=SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt (Serum)
```

## 输出示例

### 代币转账事件
```
=== 代币转账事件 ===
时间: 2024-01-15 14:30:25
类型: 接收
账户: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
代币: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
数量: 100.000000
交易签名: 5J8...abc123
区块: 123456789
==================
```

### 地址交易事件
```
=== 地址交易事件 ===
时间: 2024-01-15 14:35:12
地址: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
交易签名: 3K9...def456
状态: success
手续费: 0.000005 SOL
指令数量: 2
代币转账: 1
区块: 123456790
==================

代币转账详情:
1. 发送 50.000000 (EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v)
```

## 故障排除

### 1. RPC连接问题
如果遇到连接问题，可以尝试：
- 更换RPC节点：`https://api.devnet.solana.com`（测试网）
- 检查网络连接
- 增加重试次数：`MAX_RETRIES=10`

### 2. 没有监控到转账
可能原因：
- 代币地址错误
- 网络延迟
- 代币交易量很少

### 3. 性能优化
- 监控特定代币而非所有代币
- 调整日志级别：`LOG_LEVEL=warn`
- 增加重试间隔：`RETRY_DELAY=2000`

## 扩展功能示例

### 1. 保存转账记录到文件
```javascript
const fs = require('fs');

const customHandler = (transfer) => {
    const record = {
        timestamp: new Date().toISOString(),
        ...transfer
    };
    fs.appendFileSync('transfers.json', JSON.stringify(record) + '\n');
};

monitor.monitorSpecificToken('USDC_ADDRESS', customHandler);
```

### 2. 发送通知
```javascript
const customHandler = (transfer) => {
    const amount = Math.abs(parseFloat(transfer.amount) / Math.pow(10, transfer.decimals));
    if (amount > 1000) { // 大额转账通知
        console.log(`⚠️  检测到大额转账: ${amount} USDC`);
        // 发送邮件、Webhook等
    }
};
```

## 注意事项

1. **网络要求**：需要稳定的网络连接
2. **资源消耗**：监控大量交易可能消耗较多CPU和内存
3. **停止监控**：使用 `Ctrl+C` 安全停止
4. **RPC限制**：免费RPC节点可能有请求限制
5. **安全性**：不要在公共代码中暴露私钥或敏感信息