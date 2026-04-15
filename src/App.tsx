import { Start } from "./PageStart/main";
import { RedactorPage } from "./PageRedactor/main";
import { useState } from "react";

export function App() {
  const [currentPage, setCurrentPage] = useState(1)
  
  return <div>
      <nav>
        <button onClick={() => setCurrentPage(1)}>Страница 1</button>
        <button onClick={() => setCurrentPage(2)}>Страница 2</button>
      </nav>

      {currentPage === 1 && <Start />}
      {currentPage === 2 && <RedactorPage />}
    </div>
}
