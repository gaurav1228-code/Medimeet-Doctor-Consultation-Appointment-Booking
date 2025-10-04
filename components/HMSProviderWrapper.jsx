// components\HMSProviderWrapper.jsx
"use client";

import { HMSRoomProvider } from "@100mslive/react-sdk";

export default function HMSProviderWrapper({ children }) {
  return <HMSRoomProvider>{children}</HMSRoomProvider>;
}
