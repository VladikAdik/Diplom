import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import './styles/variables.css'
import './styles/global.css' 

const rootEl = document.getElementById("root")
const reactRoot = createRoot(rootEl!)
reactRoot.render(<App />)
