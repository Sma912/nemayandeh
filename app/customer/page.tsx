"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, LogOut, MessageSquare, FileText, Download, CheckCircle2 } from "lucide-react"
import { type Loan, STORAGE_KEYS, initializeDemoData } from "@/lib/auth"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ChatInterface } from "@/components/chat-interface"

export default function CustomerPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [loans, setLoans] = useState<Loan[]>([])
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [chatLoanId, setChatLoanId] = useState<string | null>(null)

  useEffect(() => {
    if (!user || user.role !== "customer") {
      router.push("/login")
      return
    }

    initializeDemoData()
    loadData()
  }, [user, router])

  const loadData = () => {
    const storedLoans = localStorage.getItem(STORAGE_KEYS.LOANS)
    if (storedLoans) setLoans(JSON.parse(storedLoans))
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const handleSignContract = (loanId: string) => {
    const updatedLoans = loans.map((loan) => {
      if (loan.id === loanId && loan.status === "approved") {
        return { ...loan, status: "disbursed" as const, updatedAt: new Date().toISOString() }
      }
      return loan
    })
    setLoans(updatedLoans)
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(updatedLoans))
    setSelectedLoan(null)
  }

  const myLoans = loans.filter((l) => l.customerId === user?.id)

  const getStatusColor = (status: Loan["status"]) => {
    const colors = {
      pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      under_review: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      approved: "bg-green-500/10 text-green-500 border-green-500/20",
      rejected: "bg-red-500/10 text-red-500 border-red-500/20",
      disbursed: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      completed: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    }
    return colors[status]
  }

  const getStatusText = (status: Loan["status"]) => {
    const statusTexts = {
      pending: "در انتظار",
      under_review: "در حال بررسی",
      approved: "تایید شده",
      rejected: "رد شده",
      disbursed: "پرداخت شده",
      completed: "تکمیل شده",
    }
    return statusTexts[status]
  }

  const getStatusProgress = (status: Loan["status"]) => {
    const progress = {
      pending: 20,
      under_review: 40,
      approved: 60,
      rejected: 0,
      disbursed: 80,
      completed: 100,
    }
    return progress[status]
  }

  const getStatusSteps = (status: Loan["status"]) => {
    const steps = [
      { label: "درخواست ثبت شد", completed: true },
      { label: "در حال بررسی", completed: ["under_review", "approved", "disbursed", "completed"].includes(status) },
      { label: "تایید شده", completed: ["approved", "disbursed", "completed"].includes(status) },
      { label: "قرارداد امضا شد", completed: ["disbursed", "completed"].includes(status) },
      { label: "وجه پرداخت شد", completed: ["completed"].includes(status) },
    ]
    return steps
  }

  if (!user || user.role !== "customer") return null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            <h1 className="text-xl font-bold">لون‌فلو</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">مشتری</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              خروج
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">کل وام‌ها</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myLoans.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">وام‌های فعال</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {myLoans.filter((l) => ["pending", "under_review", "approved", "disbursed"].includes(l.status)).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">مجموع مبلغ</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {myLoans.reduce((sum, loan) => sum + loan.amount, 0).toLocaleString()} تومان
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loan Applications */}
        <Card>
          <CardHeader>
            <CardTitle>درخواست‌های وام من</CardTitle>
            <CardDescription>پیگیری وضعیت درخواست‌های وام شما</CardDescription>
          </CardHeader>
          <CardContent>
            {myLoans.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">هنوز درخواست وامی ثبت نشده</h3>
                <p className="text-sm text-muted-foreground">برای شروع درخواست با کارمند وام خود تماس بگیرید</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myLoans.map((loan) => (
                  <Card key={loan.id} className="border-border">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">درخواست وام #{loan.id.slice(-6)}</CardTitle>
                          <CardDescription>کارمند: {loan.agentName}</CardDescription>
                        </div>
                        <Badge variant="outline" className={getStatusColor(loan.status)}>
                          {getStatusText(loan.status)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-sm text-muted-foreground">مبلغ وام</p>
                          <p className="text-2xl font-bold">{loan.amount.toLocaleString()} تومان</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">تاریخ درخواست</p>
                          <p className="text-lg font-medium">{new Date(loan.createdAt).toLocaleDateString("fa-IR")}</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {loan.status !== "rejected" && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">پیشرفت</span>
                            <span className="font-medium">{getStatusProgress(loan.status)}%</span>
                          </div>
                          <Progress value={getStatusProgress(loan.status)} className="h-2" />
                        </div>
                      )}

                      {/* Status Steps */}
                      {loan.status !== "rejected" && (
                        <div className="space-y-3">
                          {getStatusSteps(loan.status).map((step, index) => (
                            <div key={index} className="flex items-center gap-3">
                              <div
                                className={`flex h-6 w-6 items-center justify-center rounded-full ${
                                  step.completed ? "bg-green-500" : "bg-muted"
                                }`}
                              >
                                {step.completed && <CheckCircle2 className="h-4 w-4 text-white" />}
                              </div>
                              <span
                                className={`text-sm ${step.completed ? "text-foreground font-medium" : "text-muted-foreground"}`}
                              >
                                {step.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Rejected Message */}
                      {loan.status === "rejected" && (
                        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
                          درخواست وام شما رد شده است. لطفاً برای اطلاعات بیشتر با کارمند خود تماس بگیرید.
                        </div>
                      )}

                      {/* Documents */}
                      {loan.documents.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">مدارک</p>
                          <div className="space-y-2">
                            {loan.documents.map((doc) => (
                              <div
                                key={doc.id}
                                className="flex items-center justify-between rounded-lg border border-border p-3"
                              >
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{doc.name}</span>
                                </div>
                                <Button variant="ghost" size="sm">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        {loan.status === "approved" && (
                          <Dialog
                            open={selectedLoan?.id === loan.id}
                            onOpenChange={(open) => setSelectedLoan(open ? loan : null)}
                          >
                            <DialogTrigger asChild>
                              <Button className="flex-1">
                                <FileText className="mr-2 h-4 w-4" />
                                امضای قرارداد
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>امضای قرارداد وام</DialogTitle>
                                <DialogDescription>
                                  قرارداد وام خود را بررسی و امضا کنید تا پرداخت انجام شود
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="rounded-lg border border-border p-4 space-y-2">
                                  <p className="text-sm font-medium">جزئیات وام</p>
                                  <div className="space-y-1 text-sm text-muted-foreground">
                                    <p>مبلغ: {loan.amount.toLocaleString()} تومان</p>
                                    <p>کارمند: {loan.agentName}</p>
                                    <p>تاریخ درخواست: {new Date(loan.createdAt).toLocaleDateString("fa-IR")}</p>
                                  </div>
                                </div>
                                <Button onClick={() => handleSignContract(loan.id)} className="w-full">
                                  موافقم - امضای قرارداد
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        <Button variant="outline" onClick={() => setChatLoanId(loan.id)}>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          چت با کارمند
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Floating Chat Interface */}
      {chatLoanId && <ChatInterface loanId={chatLoanId} onClose={() => setChatLoanId(null)} />}
    </div>
  )
}
