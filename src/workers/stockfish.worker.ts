/// <reference lib="webworker" />

let engine: any = null;
let ready = false;

self.onmessage = async (e: MessageEvent) => {
  const msg = e.data;

  if (msg.type === "init") {
    try {
      // Load the Stockfish script using importScripts in a different way
      // Since we can't use importScripts in ES modules, we'll use dynamic import
      // But first, we need to create a blob URL for the script
      
      const response = await fetch('/stockfish/stockfish.js');
      const stockfishCode = await response.text();
      
      // Create a blob URL for the script so we can import it
      const blob = new Blob([stockfishCode], { type: 'application/javascript' });
      const scriptUrl = URL.createObjectURL(blob);
      
      // Import the script as a module
      await import(scriptUrl);
      
      // Clean up the blob URL
      URL.revokeObjectURL(scriptUrl);
      
      // The Stockfish module should now be available globally
      // Try different ways to access it
      let Stockfish;
      if (typeof (self as any).Stockfish === 'function') {
        Stockfish = (self as any).Stockfish;
      } else if (typeof (self as any).Module !== 'undefined') {
        // Emscripten modules often export via Module
        Stockfish = (self as any).Module;
      } else {
        throw new Error('Stockfish not found after loading script');
      }
      
      engine = Stockfish();

      engine.onmessage = (event: any) => {
        const text = typeof event === "string" ? event : event.data;
        self.postMessage({ type: "output", text });
      };

      engine.postMessage("uci");
      ready = true;
      self.postMessage({ type: "ready" });
    } catch (error) {
      self.postMessage({ type: "error", message: `Failed to load Stockfish: ${error}` });
    }
    return;
  }

  if (!ready) {
    self.postMessage({ type: "error", message: "Engine not ready" });
    return;
  }

  if (msg.type === "cmd") {
    engine.postMessage(msg.cmd);
  }
};

export {};
