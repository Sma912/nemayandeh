"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Send, X } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface Message {
  id: string
  loanId: string
  senderId: string
  senderName: string
  senderRole: "agent" | "customer"
  message: string
  timestamp: number
}

interface ChatInterfaceProps {
  loanId: string
  onClose: () => void
}

export function ChatInterface({ loanId, onClose }: ChatInterfaceProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadMessages()
    const interval = setInterval(loadMessages, 2000)
    return () => clearInterval(interval)
  }, [loanId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = () => {
    const stored = localStorage.getItem("loan_messages")
    if (stored) {
      const allMessages: Message[] = JSON.parse(stored)
      const loanMessages = allMessages.filter((m) => m.loanId === loanId)
      setMessages(loanMessages)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const sendMessage = () => {
    if (!newMessage.trim() || !user) return

    const message: Message = {
      id: Date.now().toString(),
      loanId,
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role as "agent" | "customer",
      message: newMessage.trim(),
      timestamp: Date.now(),
    }

    const stored = localStorage.getItem("loan_messages")
    const allMessages: Message[] = stored ? JSON.parse(stored) : []
    allMessages.push(message)
    localStorage.setItem("loan_messages", JSON.stringify(allMessages))

    setMessages([...messages, message])
    setNewMessage("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getRoleText = (role: "agent" | "customer") => {
    return role === "agent" ? "کارمند" : "مشتری"
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-[500px] flex flex-col bg-zinc-900 border-zinc-800 shadow-2xl z-50">
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <h3 className="font-semibold text-white">چت - وام #{loanId.slice(0, 8)}</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-zinc-400 hover:text-white">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-zinc-500 mt-8">هنوز پیامی وجود ندارد. گفتگو را شروع کنید!</div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.senderId === user?.id ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-lg p-3 ${
                  msg.senderId === user?.id ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-100"
                }`}
              >
                <div className="text-xs opacity-75 mb-1">
                  {msg.senderName} ({getRoleText(msg.senderRole)})
                </div>
                <div className="text-sm">{msg.message}</div>
                <div className="text-xs opacity-60 mt-1">{new Date(msg.timestamp).toLocaleTimeString("fa-IR")}</div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-zinc-800">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="پیام خود را بنویسید..."
            className="flex-1 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
          />
          <Button onClick={sendMessage} disabled={!newMessage.trim()} className="bg-blue-600 hover:bg-blue-700">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
