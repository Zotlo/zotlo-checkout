export const EventBus = {
  events: {} as Record<string, Array<(...args: any[]) => void>>,

  on(event: string, callback: (...args: any[]) => void) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  },

  off(event: string, callback?: (...args: any[]) => void) {
    if (!this.events[event]) return;
    this.events[event] =
      callback
        ? this.events[event].filter(cb => cb !== callback)
        : [];
  },

  emit(event: string, ...args: any[]) {
    if (!this.events[event]) return [];
    const data: any[] = [];
    for (const callback of this.events[event]) {
      data.push(callback(...args));
    }
    return data;
  }
}
