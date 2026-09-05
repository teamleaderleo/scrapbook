'use client';

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from 'react';

type Device = 'big-red' | 'macbook-air';
const DeviceContext = createContext<
  [Device, Dispatch<SetStateAction<Device>>] | null
>(null);

export function MachineDeviceProvider({ children }: { children: ReactNode }) {
  const state = useState<Device>('big-red');
  return (
    <DeviceContext.Provider value={state}>{children}</DeviceContext.Provider>
  );
}

export function useMachineDevice() {
  const shared = useContext(DeviceContext);
  const fallback = useState<Device>('big-red');
  return shared ?? fallback;
}
