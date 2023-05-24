export function connectWebSocket(url: string, timeoutMs = 5000): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);

    socket.onopen = () => {
      resolve(socket);
    };

    socket.onerror = (error) => {
      reject(error);
    };

    socket.onclose = () => {
      reject("closed!");
    };

    const timeoutId = setTimeout(() => {
      clearTimeout(timeoutId);
      reject("Connection timed out!");
    }, timeoutMs);
  });
}
