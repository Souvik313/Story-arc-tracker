import { useState } from 'react'
import { BrowserRouter , Routes , Route } from 'react-router-dom'
import Home from './pages/Home/Home';
import StoryArc from './pages/StoryArc/StoryArc';

function App() {
  return (
      <BrowserRouter>
        <Routes>
            <Route path = "/" element = {<Home />} />
            {/* <Route path = "/about" element = {<About />} />
            <Route path='/contact' element = {<Contact />} /> */}
            <Route path="/story" element={<StoryArc />} />
        </Routes>
      </BrowserRouter>
  )
}

export default App;
