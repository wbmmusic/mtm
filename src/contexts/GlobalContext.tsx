import React, { createContext, useEffect, useState, PropsWithChildren } from "react";
import { safeReceive, safeRemoveListener, safeSend } from "../helpers";

export type GlobalState = {
  admin: boolean;
  usbConnected: boolean;
  toggleAdmin?: () => void;
};

export const GlobalContext = createContext<GlobalState>({ admin: false, usbConnected: false });

const GlobalContextProvider: React.FC<PropsWithChildren<{}>> = (props) => {
  const [global, setGlobal] = useState<GlobalState>({ admin: false, usbConnected: false });
  const toggleAdmin = () => setGlobal((old) => ({ ...old, admin: !old.admin }));

  useEffect(() => {
    safeReceive("usb_status", (status: unknown) => {
      // eslint-disable-next-line no-console
      console.log("GOT USB STATUS", status);
      setGlobal((old: GlobalState) => ({ ...old, usbConnected: Boolean(status) }));
    });

    safeSend("get_usb_status");

    return () => {
      safeRemoveListener("usb_status");
    };
  }, []);

  return (
    <GlobalContext.Provider value={{ ...global, toggleAdmin }}>
      {props.children}
    </GlobalContext.Provider>
  );
};

export default GlobalContextProvider;
