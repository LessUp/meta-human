/**
 * 推送流工具
 *
 * 参考 airi 项目的 stream.ts，提供基于 ReadableStream 的推送式数据流。
 * 用于语音管线、动画队列等需要流式处理的场景。
 */

/** 流控制器接口 */
export interface StreamController<T> {
  stream: ReadableStream<T>
  write: (value: T) => void
  close: () => void
  error: (err: unknown) => void
  isClosed: () => boolean
}

/**
 * 创建推送流
 *
 * 返回一个 ReadableStream 及其控制方法，
 * 允许外部代码主动向流中推送数据。
 */
export function createPushStream<T>(): StreamController<T> {
  let closed = false
  let controller: ReadableStreamDefaultController<T> | null = null

  const stream = new ReadableStream<T>({
    start(ctrl) {
      controller = ctrl
    },
    cancel() {
      closed = true
    },
  })

  return {
    stream,
    write(value) {
      if (!controller || closed) return
      controller.enqueue(value)
    },
    close() {
      if (!controller || closed) return
      closed = true
      controller.close()
    },
    error(err) {
      if (!controller || closed) return
      closed = true
      controller.error(err)
    },
    isClosed() {
      return closed
    },
  }
}

/**
 * 读取流中的所有数据
 */
export async function readStream<T>(
  stream: ReadableStream<T>,
  handler: (value: T) => Promise<void> | void,
): Promise<void> {
  const reader = stream.getReader()
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      await handler(value as T)
    }
  } finally {
    reader.releaseLock()
  }
}
