import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { upgradeWebSocket, websocket } from 'hono/bun'

const app = new Hono()

// フロントエンド(Vite)からのアクセスを許可
app.get('/', (c) => c.text('Hono!'))
app.use('/api/*', cors())
app.get(
  '/ws',
  upgradeWebSocket((c) => {
    let proc: any;

    return {
      onOpen(_event, ws) {
        console.log('✅ Terminal connected');

        // 'script' コマンドを使用して TTY をエミュレートします
        // これにより 'can't access tty' が消え、文字が画面に表示されるようになります
        proc = Bun.spawn(["script", "-qec", "/bin/sh", "/dev/null"], {
          stdin: "pipe",
          stdout: "pipe",
          stderr: "pipe",
          env: {
            ...process.env,
            TERM: "xterm-256color",
          }
        });

        // 出力 (stdout) を読み取ってブラウザへ送る
        (async () => {
          try {
            const reader = proc.stdout.getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              ws.send(value);
            }
          } catch (e) {
            console.error("Stdout error:", e);
          }
        })();
      },

      onMessage(event, ws) {
  try {
    // 届いたデータを文字列として取得し、JSONとして解析する
    const message = JSON.parse(event.data.toString());

    if (message.type === 'data') {
      // typeが 'data' の場合のみ、その中身（content）をシェルに書き込む
      if (proc && proc.stdin) {
        proc.stdin.write(message.content);
      }
    } else if (message.type === 'resize') {
      // リサイズ命令の場合、端末のサイズ設定を更新する
      if (proc && proc.stdin) {
        const resizeCmd = `stty cols ${message.cols} rows ${message.rows}\n`;
      }
    }
  } catch (e) {
    // もしJSONとして解析できないデータが届いたら、そのまま書き込む（念のため）
    if (proc && proc.stdin) {
      proc.stdin.write(event.data.toString());
    }
  }
},

      onClose() {
        if (proc) proc.kill();
      },
    };
  })
);


app.get('/api/hello', (c) => {
  return c.json({ message: 'Windows 95 System Ready' })
})


export default {
  port: 3000,
  hostname: "0.0.0.0", // これを追加！(すべてのネットワークインターフェースで待機)
  fetch: app.fetch,
  websocket,
}