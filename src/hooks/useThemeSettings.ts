import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './useReduxHooks';
import { resetTheme, updateTheme } from '../core/redux/themeSlice';

export function useThemeSettings() {
  const dispatch = useAppDispatch();
  const themeSettings = useAppSelector((state) => state.theme.themeSettings);

  useEffect(() => {
    const htmlElement: any = document.documentElement;
    const bodyEl = document.body;
    
    Object.entries(themeSettings).forEach(([key, value]) => {
      htmlElement.setAttribute(key, value);
    });

    // Handle body classes based on data-layout
    const dataLayout = themeSettings["data-layout"];
    
    // Remove all layout-related classes first
    bodyEl.classList.remove("hidden-layout", "full-width");
    htmlElement.classList.remove("mini-sidebar");
    
    // Add appropriate classes based on layout (only for mini layout)
    if (dataLayout === "mini") {
      htmlElement.classList.add("mini-sidebar");
    }
    // Note: hidden-layout and full-width classes are only added via toggle button
  }, [themeSettings]);

  const handleUpdateTheme = useCallback((key: string, value: string) => {
    if (themeSettings["dir"] === "rtl" && key !== "dir") {
      dispatch(updateTheme({ dir: "ltr" }));
    }
    
    dispatch(updateTheme({ [key]: value }));
  }, [dispatch, themeSettings.dir]);

  const handleToggleLayout = useCallback(() => {
    const currentLayout = themeSettings["data-layout"];
    const bodyEl = document.body;
    const rootEl = document.documentElement;
    
    // Handle full-width layout toggle
    if (currentLayout === "full-width") {
      if (bodyEl.classList.contains("full-width")) {
        bodyEl.classList.remove("full-width");
      } else {
        bodyEl.classList.add("full-width");
      }
      return;
    }
    
    // Handle hidden layout toggle
    if (currentLayout === "hidden") {
      if (bodyEl.classList.contains("hidden-layout")) {
        bodyEl.classList.remove("hidden-layout");
      } else {
        bodyEl.classList.add("hidden-layout");
      }
      return;
    }
    
    // Handle default/mini toggle
    const isMini = rootEl.getAttribute("data-layout") === "mini";
    if (isMini) {
      rootEl.classList.remove("mini-sidebar");
      handleUpdateTheme("data-layout", "default");
    } else {
      rootEl.classList.add("mini-sidebar");
      handleUpdateTheme("data-layout", "mini");
    }
  }, [handleUpdateTheme, themeSettings]);

  const handleResetTheme = useCallback(() => {
    dispatch(resetTheme());
  }, [dispatch]);

  return { themeSettings, handleUpdateTheme, handleResetTheme, handleToggleLayout };
} 