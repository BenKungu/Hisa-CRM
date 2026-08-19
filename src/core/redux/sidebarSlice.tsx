import { createSlice } from "@reduxjs/toolkit";

export interface SidebarState {
  mobileSidebar: boolean;
  miniSidebar: boolean;
  expandMenu: boolean;
  hiddenLayout: boolean;
}

const initialState: SidebarState = {
  mobileSidebar: false,
  miniSidebar: false,
  expandMenu: false,
  hiddenLayout: false,
};
const sidebarSlice = createSlice({
  name: "sidebar",
  initialState,
  reducers: {
    setMobileSidebar: (state, { payload }) => {
      state.mobileSidebar = payload;
    },
    setMiniSidebar: (state, { payload }) => {
      state.miniSidebar = payload;
    },
    toggleMiniSidebar: (state) => {
      state.miniSidebar = !state.miniSidebar;
    },
    setExpandMenu: (state, { payload }) => {
      state.expandMenu = payload;
    },
    setHiddenLayout: (state, { payload }) => {
      state.hiddenLayout = payload;
    },
    toggleHiddenLayout: (state) => {
      state.hiddenLayout = !state.hiddenLayout;
    },
     resetMobileSidebar: (state) => {
      state.mobileSidebar = false;
    },
  },
});

export const { setMobileSidebar, setMiniSidebar, setExpandMenu, setHiddenLayout, toggleHiddenLayout, resetMobileSidebar, } =
  sidebarSlice.actions;

export default sidebarSlice.reducer;
