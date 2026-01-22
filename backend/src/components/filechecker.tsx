import { watch } from "chokidar";

// editフォルダを監視
watch("~/edit").on("all", async (event, path) => {
  const fileName = path.split("/").pop();
  const content = await Bun.file(path).text();

  if (event === "add" || event === "change") {
    // MySQLに保存 (擬似コード)
    // await db.execute("REPLACE INTO files (name, content) VALUES (?, ?)", [fileName, content]);
    console.log(`Synced ${fileName} to DB`);
  }
});