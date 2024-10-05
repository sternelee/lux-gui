import { createSignal } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { videoDir } from '@tauri-apps/api/path';
import "./App.css";

const matchExtra = (text: string) => {

  const titleMatch = text.match(/Title:\s*(.+)/);
  const sizeMatch = text.match(/Size:\s*(.+)\s+\(/);

  const title = titleMatch ? titleMatch[1].trim() : null;
  const size = sizeMatch ? sizeMatch[1].trim() : null;
  return {
    title,
    size
  }
}

function App() {
  const [echoMsg, setEchoMsg] = createSignal("");
  const [errorMsg, setErrorMsg] = createSignal("");
  const [isLoading, setIsLoading] = createSignal(false);
  const [input, setInput] = createSignal("");

  async function extract() {
    if (isLoading()) return;
    setIsLoading(true);
    setEchoMsg('')
    setErrorMsg('')
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    const regex = /(https?:\/\/[^\s|，|,| ]+)/g;
    const urls = input().match(regex);
    const url = urls || [input];
    const videoDirectory = await videoDir();
    const commands = ['-o', videoDirectory, ...url];
    console.log('videoDirectory:', videoDirectory);
    try {
      const res = await invoke("extract", { command: commands.join(" ") }) as string;
      console.log(res);
      const { title, size } = matchExtra(res as string);
      setEchoMsg(`${title} --- ${size}: ${videoDirectory}`);
    } catch (err) {
      console.log(err)
      const { title } = matchExtra(err as string);
      setErrorMsg('提取失败:' + title);
    }
    setIsLoading(false);
  }

  return (
    <div class="w-full">
      <h1 class="text-[20px] text-center mt-2">欢迎使用视频提取助手</h1>

      <form
        class="flex items-center justify-center mt-4"
        onSubmit={(e) => {
          e.preventDefault();
          extract();
        }}
      >
        <textarea
          rows={2}
          onChange={(e: any) => setInput(e.currentTarget.value)}
          class="textarea textarea-bordered min-w-[60%]"
          placeholder="输入您的分享内容或链接"
        />
        <button type="submit" class="btn ml-4">
          {
            isLoading() &&
            <span class="loading loading-spinner"></span>
          }
          提取
        </button>
      </form>
      {
        echoMsg() &&
        <div role="alert" class="alert alert-success w-9/12 mt-6 m-auto">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 shrink-0 stroke-current"
            fill="none"
            viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {
            echoMsg().split('\n').map(msg => <span>{msg}</span>)
          }
        </div>
      }
      {
        errorMsg() &&
        <div role="alert" class="alert alert-error w-9/12 mt-6 m-auto">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 shrink-0 stroke-current"
            fill="none"
            viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {
            errorMsg().split('\n').map(msg => <span>{msg}</span>)
          }
        </div>
      }
    </div>
  );
}

export default App;
