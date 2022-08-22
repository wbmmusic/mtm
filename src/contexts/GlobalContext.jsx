import React, { createContext, useState } from "react";

export const GlobalContext = createContext();

const GlobalContextProvider = props => {
  const [global, setGlobal] = useState({ admin: false });
  const toggleAdmin = () => {
    setGlobal(old => ({ ...old, admin: !old.admin }));
  };
  return (
    <GlobalContext.Provider value={{ ...global, toggleAdmin: toggleAdmin }}>
      {props.children}
    </GlobalContext.Provider>
  );
};

export default GlobalContextProvider;
