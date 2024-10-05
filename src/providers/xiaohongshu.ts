import { FakeHeaders } from "../utils";

export const asyncRun = async (url: string, cb: (data: any) => void) => {
  try {
    const html = await fetch(url, {
      headers: FakeHeaders,
    }).then((res) => res.text());

    // Extract title
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    if (!titleMatch || titleMatch.length !== 2) {
      cb({
        error: "解析失败",
      });
      return;
    }
    const title = titleMatch[1];
    if (title) {
      cb({
        title,
      });
    }

    const descMatch = html.match(/<meta name="description" content="(.*?)">/);
    if (descMatch && titleMatch.length !== 2) {
      cb({
        describe: descMatch[1],
      });
    }

    // Extract video URLs
    const urlsJSONMatch = html.match(/"backupUrls":(\[.+?\])/);
    if (!urlsJSONMatch || urlsJSONMatch.length !== 2) {
      cb({
        error: "无法解析视频链接",
      });
      return;
    }
    const urls: string[] = JSON.parse(urlsJSONMatch[1]);
    cb({
      video: urls,
    });
  } catch (error) {
    cb({
      error: "解析请求失败",
    });
  }
};

export const asyncRunAll = async (
  url: string,
  cb: (data: any) => void,
  abortController: AbortController
): Promise<void> => {
  const abortSignal = abortController.signal;
  // 请求小红书主页
  if (abortSignal.aborted) {
    cb({
      done: true,
    });
    return;
  }
  asyncRun(url, cb);
};
