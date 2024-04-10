/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

// ?table=111&fuzzy=true&column=id&search=1

// 定義 src_default
const src_default = {
  // 異步函數 fetch
  async fetch(request, env) {
    try {
      // 獲取 URL 數據
      const url = new URL(request.url);
      const params = new URLSearchParams(url.search);

      // 檢查請求類型
      if (request.method !== 'GET') {
        return new Response("Method Not Allowed", { status: 405 });
      }

      // 檢查路徑
      if (!request.url.startsWith('https://you.xxx/api/')) { // 路徑示例 - 也可以去掉這個 if
        return new Response("Invalid request path.", { status: 403 });
      }

      // table 參數合法性檢查 要查詢的表
      const table = params.get('table');
      if (!table) { // 必須有 table
        return new Response("The table parameter for 'table' is missing.", { status: 400 });
      }
      if (table !== "111" && table !== "222") { // 限定 table 查詢的數據表
        return new Response("Invalid table name.", { status: 403 });
      }

      // fuzzy 參數合法性檢查 @ 是否模糊搜索
      const fuzzy = params.get('fuzzy');
      if (fuzzy && fuzzy !== "true" && fuzzy !== "false") { // 限定 fuzzy 模糊查詢的選項
        return new Response("Invalid fuzzy name.", { status: 403 });
      }

      // column 參數合法性檢查 @ 要查詢的列
      const columnName = params.get('column');
      if (columnName && columnName !== "id" && columnName !== "ces" && columnName !== "......") { // 限定 column 通過查詢的數據列，指可以通過哪些列來查詢具體的行 - 例如通過 ces 來查詢 ces=111 的行
        return new Response("Invalid table name.", { status: 403 });
      }

      // search 參數合法性檢查 @ 要查詢的內容
      const searchTerm = params.get('search');
      if (!searchTerm || !/^[\u4e00-\u9fa5a-zA-Z0-9-.]+$/.test(searchTerm)) { // 不允許特殊字元 - 防止出現 「不該出現的東西」
        return new Response("Invalid search name.", { status: 403 });
      }

      // 限定返回的列
      const column = "id AS id,123 AS 123" // 例如：ces AS ces，cod AS cod，name AS name @ 使用 AS 可以實現不必嚴格查詢排序列表

      try {
        let stmt;
        let results;

        // 根據參數情況決定如何查詢
        if (fuzzy === "true" && columnName && searchTerm) {
          stmt = await env.DB.prepare(`SELECT ${column} FROM ${table} WHERE ${columnName} LIKE '%${searchTerm}%'`); // 模糊查詢
        } else if (columnName && searchTerm) {
          stmt = await env.DB.prepare(`SELECT ${column} FROM ${table} WHERE ${columnName} LIKE ${searchTerm}`); // 精準查詢
        } else {
          stmt = await env.DB.prepare(`SELECT ${column} FROM ${table}`); // 指定表後列出全部數據
        }

        results = await stmt.all();

        return new Response(JSON.stringify(results), { status: 200, headers: { 'Content-Type': 'application/json' }});
      } catch (error) {
        console.error(`Error performing database operation:`, error);
        return new Response("An error occurred while processing the request.", { status: 500 });
      }

    // 錯誤處理
    } catch (error) {
      console.error("Error processing request:", error);
      return new Response("An error occurred while processing the request.", { status: 500 });
    }
  }
};

// 将 src_default 对象导出为该模块的默认值
export default src_default;
