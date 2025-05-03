const { Connection, PublicKey, clusterApiUrl } = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID } = require('@solana/spl-token');

class SolanaTokenMonitor {
    constructor(rpcUrl = clusterApiUrl('mainnet-beta')) {
        this.connection = new Connection(rpcUrl, 'confirmed');
        this.isMonitoring = false;
    }

    async monitorTokenTransfers(tokenMint = null, options = {}) {
        const {
            onTransfer = this.defaultTransferHandler,
            maxRetries = 5,
            retryDelay = 1000
        } = options;

        console.log(`开始监控代币转账事件${tokenMint ? ` (代币: ${tokenMint})` : ''}`);
        this.isMonitoring = true;

        let retries = 0;
        
        while (this.isMonitoring && retries < maxRetries) {
            try {
                await this.connection.onLogs(
                    TOKEN_PROGRAM_ID,
                    async (logs, context) => {
                        try {
                            await this.processLogs(logs, context, tokenMint, onTransfer);
                        } catch (error) {
                            console.error('处理日志时出错:', error.message);
                        }
                    },
                    'confirmed'
                );
                retries = 0;
            } catch (error) {
                retries++;
                console.error(`连接错误 (第${retries}次重试):`, error.message);
                
                if (retries < maxRetries) {
                    await this.sleep(retryDelay * retries);
                } else {
                    console.error('达到最大重试次数，停止监控');
                    break;
                }
            }
        }
    }

    async processLogs(logs, context, targetTokenMint, onTransfer) {
        if (logs.err) {
            return;
        }

        try {
            const signature = logs.signature;
            const transaction = await this.connection.getTransaction(signature, {
                commitment: 'confirmed',
                maxSupportedTransactionVersion: 0
            });

            if (!transaction) {
                return;
            }

            const transfers = await this.parseTokenTransfers(transaction, targetTokenMint);
            
            for (const transfer of transfers) {
                await onTransfer(transfer, context);
            }
        } catch (error) {
            console.error('解析交易时出错:', error.message);
        }
    }

    async parseTokenTransfers(transaction, targetTokenMint) {
        const transfers = [];
        
        if (!transaction.meta || !transaction.meta.preTokenBalances || !transaction.meta.postTokenBalances) {
            return transfers;
        }

        const preBalances = transaction.meta.preTokenBalances;
        const postBalances = transaction.meta.postTokenBalances;

        const balanceMap = new Map();
        
        preBalances.forEach(balance => {
            const key = `${balance.accountIndex}-${balance.mint}`;
            balanceMap.set(key, { pre: balance, post: null });
        });

        postBalances.forEach(balance => {
            const key = `${balance.accountIndex}-${balance.mint}`;
            if (balanceMap.has(key)) {
                balanceMap.get(key).post = balance;
            } else {
                balanceMap.set(key, { pre: null, post: balance });
            }
        });

        for (const [key, { pre, post }] of balanceMap) {
            const mint = pre?.mint || post?.mint;
            
            if (targetTokenMint && mint !== targetTokenMint) {
                continue;
            }

            const preAmount = pre ? BigInt(pre.uiTokenAmount.amount) : 0n;
            const postAmount = post ? BigInt(post.uiTokenAmount.amount) : 0n;
            const difference = postAmount - preAmount;

            if (difference !== 0n) {
                const accountIndex = pre?.accountIndex || post?.accountIndex;
                const account = transaction.transaction.message.staticAccountKeys[accountIndex];

                transfers.push({
                    signature: transaction.transaction.signatures[0],
                    mint: mint,
                    account: account.toBase58(),
                    amount: difference.toString(),
                    decimals: pre?.uiTokenAmount.decimals || post?.uiTokenAmount.decimals || 0,
                    uiAmount: (pre?.uiTokenAmount.uiAmount || 0) - (post?.uiTokenAmount.uiAmount || 0),
                    slot: transaction.slot,
                    blockTime: transaction.blockTime,
                    type: difference > 0 ? 'receive' : 'send'
                });
            }
        }

        return transfers;
    }

    defaultTransferHandler(transfer, context) {
        const timestamp = transfer.blockTime ? 
            new Date(transfer.blockTime * 1000).toLocaleString() : 
            '未知时间';
        
        const amount = Math.abs(parseFloat(transfer.amount) / Math.pow(10, transfer.decimals)).toFixed(transfer.decimals);
        const type = transfer.type === 'receive' ? '接收' : '发送';
        
        console.log(`
=== 代币转账事件 ===
时间: ${timestamp}
类型: ${type}
账户: ${transfer.account}
代币: ${transfer.mint}
数量: ${amount}
交易签名: ${transfer.signature}
区块: ${transfer.slot}
==================`);
    }

    async monitorSpecificToken(tokenMintAddress, customHandler) {
        return this.monitorTokenTransfers(tokenMintAddress, {
            onTransfer: customHandler || this.defaultTransferHandler
        });
    }

    async monitorAllTokens(customHandler) {
        return this.monitorTokenTransfers(null, {
            onTransfer: customHandler || this.defaultTransferHandler
        });
    }

    stop() {
        console.log('停止监控...');
        this.isMonitoring = false;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

if (require.main === module) {
    const monitor = new SolanaTokenMonitor();
    
    const args = process.argv.slice(2);
    const tokenMint = args[0];
    
    if (tokenMint) {
        console.log(`监控指定代币: ${tokenMint}`);
        monitor.monitorSpecificToken(tokenMint);
    } else {
        console.log('监控所有代币转账');
        monitor.monitorAllTokens();
    }
    
    process.on('SIGINT', () => {
        console.log('\n收到中断信号');
        monitor.stop();
        process.exit(0);
    });
}

module.exports = SolanaTokenMonitor;