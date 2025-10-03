"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, X } from "lucide-react"
import { type Message, type User, STORAGE_KEYS } from "@/lib/auth"
import { Badge } from "@/components/ui/badge"

interface AdminAgentChatProps {
  currentUser: User
  selectedAgent: User | null
  onClose: () => void
}

export function AdminAgentChat({ currentUser, selectedAgent, onClose }: AdminAgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadMessages()
    const interval = setInterval(loadMessages, 2000)
    return () => clearInterval(interval)
  }, [selectedAgent])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const loadMessages = () => {
    const storedMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES)
    if (storedMessages) {
      const allMessages: Message[] = JSON.parse(storedMessages)
      const filtered = allMessages.filter(
        (m) =>
          m.type === "admin-agent" &&
          selectedAgent &&
          ((m.senderId === currentUser.id && m.recipientId === selectedAgent.id) ||
            (m.senderId === selectedAgent.id && m.recipientId === currentUser.id)),
      )
      setMessages(filtered)
    }
  }

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedAgent) return

    const message: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      recipientId: selectedAgent.id,
      content: newMessage,
      timestamp: new Date().toISOString(),
      type: "admin-agent",
    }

    const storedMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES)
    const allMessages: Message[] = storedMessages ? JSON.parse(storedMessages) : []
    allMessages.push(message)
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(allMessages))

    setMessages([...messages, message])
    setNewMessage("")
  }

  if (!selectedAgent) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          یک کارمند را برای شروع گفتگو انتخاب کنید
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>گفتگو با {selectedAgent.name}</CardTitle>
          <p className="text-sm text-muted-foreground">{selectedAgent.phone}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderId === currentUser.id ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.senderId === currentUser.id ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium">{message.senderName}</span>
                    <Badge variant="outline" className="text-xs">
                      {message.senderRole === "admin" ? "مدیر" : "کارمند"}
                    </Badge>
                  </div>
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString("fa-IR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="پیام خود را بنویسید..."
              className="flex-1"
            />
            <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
