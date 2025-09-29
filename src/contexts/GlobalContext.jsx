import React, { createContext, useEffect, useState } from "react";

export const GlobalContext = createContext();

const GlobalContextProvider = props => {
  const [global, setGlobal] = useState({ admin: false, usbConnected: false });
  const toggleAdmin = () => setGlobal(old => ({ ...old, admin: !old.admin }));

  useEffect(() => {
    if (window.electron) {
      window.electron.receive("usb_status", status => {
        console.log("GOT USB STATUS", status);
        setGlobal(old => ({ ...old, usbConnected: status }));
      });
      window.electron.send("get_usb_status");
    }

    return () => {
      window.electron?.removeListener("usb_status");
    };
  }, []);

  return (
    <GlobalContext.Provider value={{ ...global, toggleAdmin: toggleAdmin }}>
      {props.children}
    </GlobalContext.Provider>
  );
};

export default GlobalContextProvider;
