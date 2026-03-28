// @/styles/global.ts



export const globalCSS = `


html, body {
  color: var(--foreground);
  background-color: var(--background);
  max-width: 768px;
  margin-left: auto;
  margin-right: auto;
  padding-left: 10px;
  padding-right: 10px;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: rgba(0,0,0,0);
  touch-action: manipulation;
  width: 100%;
}

* {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
    max-width: 100%;
    box-sizing: border-box;
}


body {
  margin: 0;
  -webkit-text-size-adjust: none;
  min-height: 100%;
  box-sizing: border-box;
}

hr {
  border: none;
  border-top: 1px solid var(--border);
  margin: 16px 0;
  width: 100%;
}  

::selection {
  background-color: var(--primary);
  color: var(--background);
}


`
