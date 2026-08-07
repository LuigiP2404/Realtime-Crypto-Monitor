import { vi } from 'vitest'

class MockedWebSocket {
    static instances: MockedWebSocket[] = [];
    url: string;
    readyState = 0;
    onopen: (() => void) | null = null;
    onerror: (() => void) | null = null;
    onclose: (() => void) | null = null;
    onmessage: ((e: { data: string }) => void) | null = null;

    constructor(url: string) {
        this.url = url;
        MockedWebSocket.instances.push(this);
    }

    close() {
        if (this.readyState === 3) return;
        this.readyState = 3;
        this.onclose?.();
    }

    emitOpen() {
        this.readyState = 1;
        this.onopen?.();
    }

    emitMessage(payload: unknown) {
        const json = { data: JSON.stringify(payload) }
        this.onmessage?.(json);
    }

    emitError() {
        this.onerror?.();
    }

    emitClose() {
        this.close();
    }
}


export function mockWebSocket(): { instances: MockedWebSocket[]; last: () => MockedWebSocket } {
    MockedWebSocket.instances.length = 0;
    vi.stubGlobal('WebSocket', MockedWebSocket);
    const instances = MockedWebSocket.instances;
    const last = () => {
        return instances[instances.length - 1]
    }
    return { instances, last }
}
