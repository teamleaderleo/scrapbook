export {};

declare global {
  interface Window {
    __advanceActivityClock: (milliseconds: number) => void;
  }
}
