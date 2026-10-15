import { createContext, useCallback, useContext, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {

  const [messages, setMessages] = useState([])

  const notifier = useCallback((texte, type = 'succes') => {
    const id = Date.now() + Math.random()
    setMessages((m) => [...m, { id, texte, type }])
    setTimeout(() => {
      setMessages((m) => m.filter((x) => x.id !== id))
    }, 3500)
  }, [])

  return (
    <ToastContext.Provider value={{ notifier }}>
      {children}

      <div className="toast-zone" role="status" aria-live="polite">
        {messages.map((m) => (
          <div
            key={m.id}
            className={m.type === 'erreur' ? 'toast erreur' : 'toast'}
          >
            {m.texte}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)