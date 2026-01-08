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
        // 入力データをシェルに書き込む
        // Bun の subprocess.stdin は直接 write() が使えます（writer() は不要です）
        if (proc && proc.stdin) {
          const data = event.data;
          proc.stdin.write(data);
          // stdoutに強制的に流す必要はありませんが、
          // もし反応が悪ければ proc.stdin.flush() を検討します
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
  fetch: app.fetch,
  hostname: "0.0.0.0",
  websocket,
}