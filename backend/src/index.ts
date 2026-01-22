import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { upgradeWebSocket, websocket } from 'hono/bun'
import chokidar from 'chokidar'
import mysql from 'mysql2/promise'

const app = new Hono()

const dbConfig = {
  host: "db",
  user: "root",
  password: "password",
  database: "terminal_db"
}


// 1. サーバー起動時にDBからファイルを復元する
async function restoreFilesFromDB() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows]: any = await connection.execute("SELECT name, content FROM files");
    
    // editディレクトリがなければ作成
    const fs = require('fs');
    if (!fs.existsSync('./edit')) fs.mkdirSync('./edit');

    for (const file of rows) {
      await Bun.write(`./edit/${file.name}`, file.content);
      console.log(`Restored: ${file.name}`);
    }
    await connection.end();
    console.log("✅ Files restored from DB.");
  } catch (e) {
    console.error("❌ DB Restore Error:", e);
  }
}

await restoreFilesFromDB();

// 2. ファイル変更を監視してDBに保存する (chokidar)
chokidar.watch("./edit", { ignoreInitial: true }).on("all", async (event, path) => {
  if (event === "add" || event === "change") {
    try {
      const fileName = path.split("/").pop();
      const content = await Bun.file(path).text();
      const connection = await mysql.createConnection(dbConfig);
      
      // REPLACE INTO で、あれば更新、なければ挿入
      await connection.execute(
        "REPLACE INTO files (name, content) VALUES (?, ?)",
        [fileName, content]
      );
      await connection.end();
      console.log(`💾 Synced to DB: ${fileName}`);
    } catch (e) {
      console.error("❌ Sync Error:", e);
    }
  }
});

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
          cwd: "./edit",
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