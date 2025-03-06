import { createContext, useState } from "react"

export const authContext = createContext()

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(!!localStorage.getItem('token'))

  return (
    <authContext.Provider value={{ auth, setAuth }}>
      {children}
    </authContext.Provider>
  )
}
