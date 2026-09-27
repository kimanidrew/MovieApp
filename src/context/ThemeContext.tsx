"use client";
import React,{createContext,useContext,useEffect,useState} from "react";
export type ThemeColors={background:string;foreground:string;primaryBrand:string;secondary:string;tertiary:string};
export const defaultThemes:Record<string,ThemeColors>={Tidpix:{background:"#070707",foreground:"#fff",primaryBrand:"#f4b400",secondary:"#e68a00",tertiary:"#fff"}};
type ThemeContextType={activeTheme:string;colors:ThemeColors;setTheme:(themeName:string)=>void;updateColor:(key:keyof ThemeColors,value:string)=>void};
const ThemeContext=createContext<ThemeContextType|undefined>(undefined);
export const ThemeProvider=({children}:{children:React.ReactNode})=>{
 const [activeTheme,setActiveThemeState]=useState("Tidpix"); const [colors,setColors]=useState(defaultThemes.Tidpix); const [mounted,setMounted]=useState(false);
 useEffect(()=>{setMounted(true);const stored=localStorage.getItem("tidpix-theme-colors");if(stored){try{setColors({...defaultThemes.Tidpix,...JSON.parse(stored)});}catch{setColors(defaultThemes.Tidpix);}}},[]);
 useEffect(()=>{if(!mounted)return;const root=document.documentElement;root.style.setProperty("--background",colors.background);root.style.setProperty("--foreground",colors.foreground);root.style.setProperty("--primary-brand",colors.primaryBrand);root.style.setProperty("--secondary",colors.secondary);root.style.setProperty("--tertiary",colors.tertiary);localStorage.setItem("tidpix-theme-name",activeTheme);localStorage.setItem("tidpix-theme-colors",JSON.stringify(colors));},[colors,activeTheme,mounted]);
 const setTheme=(name:string)=>{if(name==="Tidpix"){setActiveThemeState("Tidpix");setColors(defaultThemes.Tidpix);}};
 const updateColor=(key:keyof ThemeColors,value:string)=>{setActiveThemeState("Tidpix");setColors(prev=>({...prev,[key]:value}));};
 if(!mounted)return <>{children}</>;
 return <ThemeContext.Provider value={{activeTheme,colors,setTheme,updateColor}}>{children}</ThemeContext.Provider>;
};
export const useTheme=()=>{const context=useContext(ThemeContext);if(!context)throw new Error("useTheme must be used within a ThemeProvider");return context;};