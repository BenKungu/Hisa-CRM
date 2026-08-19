import React from "react";
import { Link } from "react-router-dom";

export const itemRender = (_current: number, type: "page" | "prev" | "next" | "jump-prev" | "jump-next", element: React.ReactNode): React.ReactNode => {
  if (type === "prev") {
    return <Link to="#">Previous</Link>;
  }
  if (type === "next") {
    return <Link to="#">Next</Link>;
  }
  return element;
}

export const onShowSizeChange = (current: number, pageSize: number): void => {
  console.log(current, pageSize);
}
