import React, { createContext } from "react";

export const Appcontext = createContext<{
  isAuth: string;
  setIsAuth: React.Dispatch<React.SetStateAction<string>>;
}>({
  isAuth: "user",
  setIsAuth: () => {},
}); 