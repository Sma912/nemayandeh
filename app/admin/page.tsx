"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  Users,
  FileText,
  TrendingUp,
  LogOut,
  UserPlus,
  Trash2,
  Eye,
  MessageSquare,
  Plus,
  Download,
  MessageCircle,
  Send,
  Power,
  PowerOff,
  UserCheck,
  Upload,
} from "lucide-react"
import { type Loan, type User, type SystemSettings, type LoanType, STORAGE_KEYS, initializeDemoData } from "@/lib/auth"
import { AdminAgentChat } from "@/components/admin-agent-chat"
import { Textarea } from "@/components/ui/textarea"
import { normalizePhoneNumber } from "@/lib/phone-utils"

export default function AdminPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [loans, setLoans] = useState<Loan[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [isAddAgentOpen, setIsAddAgentOpen] = useState(false)
  const [newAgent, setNewAgent] = useState({ name: "", phone: "" })
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [isViewLoanOpen, setIsViewLoanOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<User | null>(null)
  const [isAddLoanTypeOpen, setIsAddLoanTypeOpen] = useState(false)
  const [newLoanType, setNewLoanType] = useState({
    name: "",
    creditCheckFee: "",
    commissionRate: "",
    requiredFields: "",
    requiresGuarantors: false,
    minGuarantors: "0",
    maxGuarantors: "0",
    guarantorFields: "",
  })

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/login")
      return
    }

    initializeDemoData()
    loadData()
    const interval = setInterval(loadData, 3000)
    return () => clearInterval(interval)
  }, [user, router])

  const loadData = () => {
    const storedLoans = localStorage.getItem(STORAGE_KEYS.LOANS)
    const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS)
    const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS)

    if (storedLoans) {
      const parsedLoans = JSON.parse(storedLoans)
      const migratedLoans = parsedLoans.map((loan: any) => ({
        ...loan,
        loanType: loan.loanType || "resalat",
        loanTypeName: loan.loanTypeName || "رسالت",
        creditCheckFee: loan.creditCheckFee || 250000,
        commission: loan.commission || (loan.amount ? loan.amount * 0.02 : 0),
        guarantors: loan.guarantors || [],
        creditCheck: loan.creditCheck || {
          paid: false,
          amount: 250000,
        },
        contract: loan.contract || {},
      }))
      setLoans(migratedLoans)
      localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(migratedLoans))
    }

    if (storedUsers) setUsers(JSON.parse(storedUsers))

    if (storedSettings) {
      const parsedSettings = JSON.parse(storedSettings)
      const migratedSettings = {
        ...parsedSettings,
        loanTypes: parsedSettings.loanTypes.map((lt: any) => ({
          ...lt,
          requiredFields: lt.requiredFields || [],
          requiresGuarantors: lt.requiresGuarantors || false,
          minGuarantors: lt.minGuarantors || 0,
          maxGuarantors: lt.maxGuarantors || 0,
          guarantorFields: lt.guarantorFields || [],
        })),
        feePaymentAccount: parsedSettings.feePaymentAccount || {
          accountNumber: "",
          shebaNumber: "",
          bankName: "",
          accountHolderName: "",
        },
        walletRechargeAccount: parsedSettings.walletRechargeAccount || {
          accountNumber: "",
          shebaNumber: "",
          bankName: "",
          accountHolderName: "",
        },
      }
      setSettings(migratedSettings)
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(migratedSettings))
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const handleSwitchToAgent = () => {
    // Find the first agent user
    const agentUser = users.find(u => u.role === "agent" && u.isActive)
    if (agentUser) {
      // Set the agent user as current user
      localStorage.setItem("loan-app-user", JSON.stringify(agentUser))
      // Redirect to agent page
      router.push("/agent")
    } else {
      alert("هیچ کارمند فعالی یافت نشد")
    }
  }

  const handleSwitchToSpecificAgent = (agentId: string) => {
    const agentUser = users.find(u => u.id === agentId && u.role === "agent")
    if (agentUser) {
      // Set the specific agent user as current user
      localStorage.setItem("loan-app-user", JSON.stringify(agentUser))
      // Redirect to agent page
      router.push("/agent")
    } else {
      alert("کارمند مورد نظر یافت نشد")
    }
  }

  const handleViewContract = (agent: User) => {
    // If we stored a contract text for this agent, open it; otherwise if URL present, open URL
    const storedText = localStorage.getItem(`contract-text-${agent.id}`)
    if (storedText) {
      const blob = new Blob([storedText], { type: "text/plain;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      window.open(url, "_blank")
      return
    }
    if (agent.contractUrl) {
      window.open(agent.contractUrl, "_blank")
      return
    }
    alert("قراردادی برای این کارمند ثبت نشده است")
  }

  const handleUploadSignedContract = async (agentId: string, file: File) => {
    // In this MVP we store the file as an object URL in localStorage by reading as data URL
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result || "")
      const updated = users.map((u) => (u.id === agentId ? { ...u, signedContractUrl: dataUrl } : u))
      setUsers(updated)
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated))
      alert("قرارداد امضا شده با موفقیت بارگذاری شد")
    }
    reader.readAsDataURL(file)
  }

  const generatePassword = () => {
    const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    let password = ""
    for (let i = 0; i < 8; i++) {
      password += chars[Math.floor(Math.random() * chars.length)]
    }
    return password
  }

  const shareCredentials = (agent: User, platform: "sms" | "whatsapp" | "telegram") => {
    const message = `سلام ${agent.name} عزیز،

اطلاعات ورود شما به سیستم لون‌فلو:
شماره تلفن: ${agent.phone}
رمز عبور: ${agent.password}

لطفا از این اطلاعات برای ورود به سیستم استفاده کنید.`

    const encodedMessage = encodeURIComponent(message)

    let url = ""
    switch (platform) {
      case "sms":
        url = `sms:${agent.phone}?body=${encodedMessage}`
        break
      case "whatsapp":
        // Remove any non-digit characters from phone
        const cleanPhone = agent.phone.replace(/\D/g, "")
        url = `https://wa.me/${cleanPhone}?text=${encodedMessage}`
        break
      case "telegram":
        url = `https://t.me/share/url?url=${encodeURIComponent("https://loan-app.com")}&text=${encodedMessage}`
        break
    }

    window.open(url, "_blank")
  }

  const handleAddAgent = () => {
    if (!newAgent.name || !newAgent.phone) return

    const password = generatePassword()

    const normalizedPhone = normalizePhoneNumber(newAgent.phone)

    console.log("[v0] Creating new agent:", { name: newAgent.name, phone: normalizedPhone, password })

    const agent: User = {
      id: `agent-${Date.now()}`,
      name: newAgent.name,
      phone: normalizedPhone,
      role: "agent",
      password: password,
      isActive: true,
      createdAt: new Date().toISOString(),
    }

    const updatedUsers = [...users, agent]
    console.log("[v0] Updated users array:", updatedUsers)

    setUsers(updatedUsers)
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers))

    const savedData = localStorage.getItem(STORAGE_KEYS.USERS)
    console.log("[v0] Verified saved data:", savedData)

    setNewAgent({ name: "", phone: "" })
    setIsAddAgentOpen(false)
  }

  const handleDeleteAgent = (agentId: string) => {
    const updatedUsers = users.filter((u) => u.id !== agentId)
    setUsers(updatedUsers)
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers))
  }

  const handleToggleAgentStatus = (agentId: string) => {
    const updatedUsers = users.map((u) =>
      u.id === agentId ? { ...u, isActive: u.isActive === false ? true : false } : u,
    )
    setUsers(updatedUsers)
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers))
  }

  const handleUpdateLoanStatus = (loanId: string, newStatus: Loan["status"]) => {
    const updatedLoans = loans.map((loan) =>
      loan.id === loanId ? { ...loan, status: newStatus, updatedAt: new Date().toISOString() } : loan,
    )
    setLoans(updatedLoans)
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(updatedLoans))
  }

  const handleUpdateSettings = (newSettings: SystemSettings) => {
    setSettings(newSettings)
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings))
  }

  const handleViewLoan = (loan: Loan) => {
    setSelectedLoan(loan)
    setIsViewLoanOpen(true)
  }

  const handleAddLoanType = () => {
    if (!newLoanType.name || !settings) return

    const loanType: LoanType = {
      id: `loan-type-${Date.now()}`,
      name: newLoanType.name,
      creditCheckFee: Number.parseFloat(newLoanType.creditCheckFee) || 0,
      commissionRate: Number.parseFloat(newLoanType.commissionRate) || 0,
      requiredFields: newLoanType.requiredFields
        .split("،")
        .map((f) => f.trim())
        .filter(Boolean),
      requiresGuarantors: newLoanType.requiresGuarantors,
      minGuarantors: Number.parseInt(newLoanType.minGuarantors) || 0,
      maxGuarantors: Number.parseInt(newLoanType.maxGuarantors) || 0,
      guarantorFields: newLoanType.guarantorFields
        .split("،")
        .map((f) => f.trim())
        .filter(Boolean),
    }

    const updated = {
      ...settings,
      loanTypes: [...settings.loanTypes, loanType],
    }
    handleUpdateSettings(updated)
    setNewLoanType({
      name: "",
      creditCheckFee: "",
      commissionRate: "",
      requiredFields: "",
      requiresGuarantors: false,
      minGuarantors: "0",
      maxGuarantors: "0",
      guarantorFields: "",
    })
    setIsAddLoanTypeOpen(false)
  }

  const handleDeleteLoanType = (loanTypeId: string) => {
    if (!settings) return
    const updated = {
      ...settings,
      loanTypes: settings.loanTypes.filter((lt) => lt.id !== loanTypeId),
    }
    handleUpdateSettings(updated)
  }

  const agents = users.filter((u) => u.role === "agent")
  const customers = users.filter((u) => u.role === "customer")

  const stats = {
    totalLoans: loans.length,
    activeLoans: loans.filter((l) => ["pending", "under_review", "approved"].includes(l.status)).length,
    totalAgents: agents.length,
    totalCustomers: customers.length,
  }

  const getStatusColor = (status: Loan["status"]) => {
    const colors: Record<Loan["status"], string> = {
      pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      under_review: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      check_received: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
      contract_sent: "bg-violet-500/10 text-violet-600 border-violet-500/20",
      contract_approved: "bg-teal-500/10 text-teal-600 border-teal-500/20",
      credit_transferred: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
      fee_paid: "bg-orange-500/10 text-orange-600 border-orange-500/20",
      return_receipt_issued: "bg-slate-500/10 text-slate-600 border-slate-500/20",
      check_delivered: "bg-lime-500/10 text-lime-600 border-lime-500/20",
      commission_paid: "bg-pink-500/10 text-pink-600 border-pink-500/20",
      completed: "bg-gray-500/10 text-gray-600 border-gray-500/20",
      rejected: "bg-red-500/10 text-red-600 border-red-500/20",
    }
    return colors[status]
  }

  const getStatusText = (status: Loan["status"]) => {
    const statusTexts: Record<Loan["status"], string> = {
      pending: "در انتظار",
      under_review: "در حال بررسی",
      approved: "تایید شده",
      check_received: "چک دریافت شد",
      contract_sent: "قرارداد ارسال شد",
      contract_approved: "قرارداد تایید شد",
      credit_transferred: "اعتبار واریز شد",
      fee_paid: "هزینه پرداخت شد",
      return_receipt_issued: "رسید عودت صادر شد",
      check_delivered: "چک تحویل شد",
      commission_paid: "کارمزد پرداخت شد",
      completed: "تکمیل شده",
      rejected: "رد شده",
    }
    return statusTexts[status]
  }

  if (!user || user.role !== "admin") return null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            <h1 className="text-xl font-bold">پنل مدیریت لون‌فلو</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">مدیر سیستم</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSwitchToAgent}>
              <UserCheck className="mr-2 h-4 w-4" />
              ورود به پنل کارمند
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              خروج
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">کل وام‌ها</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLoans}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">وام‌های فعال</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeLoans}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">کل کارمندان</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAgents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">کل مشتریان</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="loans" className="space-y-4">
          <TabsList>
            <TabsTrigger value="loans">وام‌ها</TabsTrigger>
            <TabsTrigger value="agents">کارمندان</TabsTrigger>
            <TabsTrigger value="customers">مشتریان</TabsTrigger>
            <TabsTrigger value="chat">گفتگو با کارمندان</TabsTrigger>
            <TabsTrigger value="settings">تنظیمات</TabsTrigger>
          </TabsList>

          {/* Loans Tab */}
          <TabsContent value="loans" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>همه وام‌ها</CardTitle>
                <CardDescription>مدیریت و پیگیری تمام درخواست‌های وام</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>مشتری</TableHead>
                      <TableHead>کارمند</TableHead>
                      <TableHead>نوع وام</TableHead>
                      <TableHead>مبلغ</TableHead>
                      <TableHead>کارمزد</TableHead>
                      <TableHead>وضعیت</TableHead>
                      <TableHead>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loans.map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{loan.customerName}</p>
                            <p className="text-sm text-muted-foreground">{loan.customerPhone}</p>
                          </div>
                        </TableCell>
                        <TableCell>{loan.agentName}</TableCell>
                        <TableCell>{loan.loanTypeName || "رسالت"}</TableCell>
                        <TableCell className="font-medium">{(loan.amount || 0).toLocaleString()} تومان</TableCell>
                        <TableCell className="font-medium text-green-500">
                          {(loan.commission || 0).toLocaleString()} تومان
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(loan.status)}>
                            {getStatusText(loan.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleViewLoan(loan)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Select
                              value={loan.status}
                              onValueChange={(value) => handleUpdateLoanStatus(loan.id, value as Loan["status"])}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">در انتظار</SelectItem>
                                <SelectItem value="under_review">در حال بررسی</SelectItem>
                                <SelectItem value="approved">تایید شده</SelectItem>
                                <SelectItem value="rejected">رد شده</SelectItem>
                                <SelectItem value="disbursed">پرداخت شده</SelectItem>
                                <SelectItem value="completed">تکمیل شده</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agents Tab */}
          <TabsContent value="agents" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>کارمندان</CardTitle>
                    <CardDescription>مدیریت کارمندان وام</CardDescription>
                  </div>
                  <Dialog open={isAddAgentOpen} onOpenChange={setIsAddAgentOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="mr-2 h-4 w-4" />
                        افزودن کارمند
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>افزودن کارمند جدید</DialogTitle>
                        <DialogDescription>ایجاد حساب کارمند جدید</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="agent-name">نام</Label>
                          <Input
                            id="agent-name"
                            value={newAgent.name}
                            onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                            placeholder="نام کارمند را وارد کنید"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="agent-phone">شماره تلفن</Label>
                          <Input
                            id="agent-phone"
                            value={newAgent.phone}
                            onChange={(e) => setNewAgent({ ...newAgent, phone: e.target.value })}
                            placeholder="شماره تلفن را وارد کنید"
                          />
                        </div>
                        <Button onClick={handleAddAgent} className="w-full">
                          ایجاد کارمند
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>نام</TableHead>
                      <TableHead>تلفن</TableHead>
                      <TableHead>رمز عبور</TableHead>
                      <TableHead>وضعیت</TableHead>
                      <TableHead>تاریخ عضویت</TableHead>
                      <TableHead>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agents.map((agent) => (
                      <TableRow key={agent.id}>
                        <TableCell className="font-medium">{agent.name}</TableCell>
                        <TableCell>{agent.phone}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                              {agent.password || "N/A"}
                            </code>
                            {agent.password && (
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => shareCredentials(agent, "sms")}
                                  title="ارسال از طریق پیامک"
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => shareCredentials(agent, "whatsapp")}
                                  title="ارسال از طریق واتساپ"
                                >
                                  <MessageCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => shareCredentials(agent, "telegram")}
                                  title="ارسال از طریق تلگرام"
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              agent.isActive !== false
                                ? "bg-green-500/10 text-green-500 border-green-500/20"
                                : "bg-red-500/10 text-red-500 border-red-500/20"
                            }
                          >
                            {agent.isActive !== false ? "فعال" : "غیرفعال"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(agent.createdAt).toLocaleDateString("fa-IR")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewContract(agent)}
                              title="مشاهده قرارداد"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {agent.signedContractUrl ? (
                              <a
                                href={agent.signedContractUrl}
                                download={`signed-contract-${agent.id}.pdf`}
                                className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-input hover:bg-accent"
                                title="دانلود قرارداد امضا شده"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            ) : (
                              <label
                                className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-input hover:bg-accent cursor-pointer"
                                title="بارگذاری قرارداد امضا شده"
                              >
                                <Upload className="h-4 w-4" />
                                <input
                                  type="file"
                                  accept="application/pdf,image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0]
                                    if (f) handleUploadSignedContract(agent.id, f)
                                  }}
                                />
                              </label>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSwitchToSpecificAgent(agent.id)}
                              title="ورود به پنل کارمند"
                              className="bg-blue-50 hover:bg-blue-100 border-blue-200"
                            >
                              <UserCheck className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleAgentStatus(agent.id)}
                              title={agent.isActive !== false ? "غیرفعال کردن" : "فعال کردن"}
                            >
                              {agent.isActive !== false ? (
                                <PowerOff className="h-4 w-4 text-red-500" />
                              ) : (
                                <Power className="h-4 w-4 text-green-500" />
                              )}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteAgent(agent.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>مشتریان</CardTitle>
                <CardDescription>مشاهده تمام مشتریان ثبت شده</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>نام</TableHead>
                      <TableHead>تلفن</TableHead>
                      <TableHead>کارمند</TableHead>
                      <TableHead>تاریخ عضویت</TableHead>
                      <TableHead>وام‌ها</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => {
                      const customerLoans = loans.filter((l) => l.customerId === customer.id)
                      // Determine the agent based on the most recent loan for this customer
                      let agentDisplay = "-"
                      if (customerLoans.length > 0) {
                        const sorted = customerLoans
                          .slice()
                          .sort((a, b) => {
                            const aTime = new Date(a.updatedAt || a.createdAt).getTime()
                            const bTime = new Date(b.updatedAt || b.createdAt).getTime()
                            return bTime - aTime
                          })
                        const latest = sorted[0]
                        agentDisplay = latest.agentName || "-"
                      }
                      return (
                        <TableRow key={customer.id}>
                          <TableCell className="font-medium">{customer.name}</TableCell>
                          <TableCell>{customer.phone}</TableCell>
                          <TableCell>{agentDisplay}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(customer.createdAt).toLocaleDateString("fa-IR")}
                          </TableCell>
                          <TableCell>{customerLoans.length}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>کارمندان</CardTitle>
                  <CardDescription>انتخاب کارمند برای گفتگو</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {agents.map((agent) => (
                    <Button
                      key={agent.id}
                      variant={selectedAgent?.id === agent.id ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => setSelectedAgent(agent)}
                    >
                      <MessageSquare className="ml-2 h-4 w-4" />
                      {agent.name}
                    </Button>
                  ))}
                </CardContent>
              </Card>
              <div className="col-span-2">
                {user && (
                  <AdminAgentChat
                    currentUser={user}
                    selectedAgent={selectedAgent}
                    onClose={() => setSelectedAgent(null)}
                  />
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>تنظیمات سیستم</CardTitle>
                <CardDescription>مدیریت انواع وام و تنظیمات کلی</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>کد ملی صاحب چک</Label>
                  <Input
                    value={settings?.checkOwnerNationalId || ""}
                    onChange={(e) =>
                      settings && handleUpdateSettings({ ...settings, checkOwnerNationalId: e.target.value })
                    }
                    placeholder="کد ملی صاحب چک را وارد کنید"
                    dir="ltr"
                  />
                  <p className="text-xs text-muted-foreground">
                    این کد ملی برای ثبت چک‌های دریافتی از مشتریان استفاده می‌شود
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>شماره کارت برای واریز</Label>
                  <Input
                    value={settings?.bankCardNumber || ""}
                    onChange={(e) => settings && handleUpdateSettings({ ...settings, bankCardNumber: e.target.value })}
                    placeholder="شماره کارت را وارد کنید"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-semibold">حساب دریافت هزینه امتیاز</h3>
                  <p className="text-sm text-muted-foreground">
                    مشتری پس از دریافت وام، هزینه امتیاز را به این حساب واریز می‌کند
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>شماره حساب</Label>
                      <Input
                        value={settings?.feePaymentAccount?.accountNumber || ""}
                        onChange={(e) =>
                          settings &&
                          handleUpdateSettings({
                            ...settings,
                            feePaymentAccount: {
                              ...settings.feePaymentAccount,
                              accountNumber: e.target.value,
                              shebaNumber: settings.feePaymentAccount?.shebaNumber || "",
                              bankName: settings.feePaymentAccount?.bankName || "",
                              accountHolderName: settings.feePaymentAccount?.accountHolderName || "",
                            },
                          })
                        }
                        placeholder="شماره حساب"
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>شماره شبا</Label>
                      <Input
                        value={settings?.feePaymentAccount?.shebaNumber || ""}
                        onChange={(e) =>
                          settings &&
                          handleUpdateSettings({
                            ...settings,
                            feePaymentAccount: {
                              ...settings.feePaymentAccount,
                              accountNumber: settings.feePaymentAccount?.accountNumber || "",
                              shebaNumber: e.target.value,
                              bankName: settings.feePaymentAccount?.bankName || "",
                              accountHolderName: settings.feePaymentAccount?.accountHolderName || "",
                            },
                          })
                        }
                        placeholder="IR..."
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>نام بانک</Label>
                      <Input
                        value={settings?.feePaymentAccount?.bankName || ""}
                        onChange={(e) =>
                          settings &&
                          handleUpdateSettings({
                            ...settings,
                            feePaymentAccount: {
                              ...settings.feePaymentAccount,
                              accountNumber: settings.feePaymentAccount?.accountNumber || "",
                              shebaNumber: settings.feePaymentAccount?.shebaNumber || "",
                              bankName: e.target.value,
                              accountHolderName: settings.feePaymentAccount?.accountHolderName || "",
                            },
                          })
                        }
                        placeholder="نام بانک"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>نام صاحب حساب</Label>
                      <Input
                        value={settings?.feePaymentAccount?.accountHolderName || ""}
                        onChange={(e) =>
                          settings &&
                          handleUpdateSettings({
                            ...settings,
                            feePaymentAccount: {
                              ...settings.feePaymentAccount,
                              accountNumber: settings.feePaymentAccount?.accountNumber || "",
                              shebaNumber: settings.feePaymentAccount?.shebaNumber || "",
                              bankName: settings.feePaymentAccount?.bankName || "",
                              accountHolderName: e.target.value,
                            },
                          })
                        }
                        placeholder="نام صاحب حساب"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-semibold">حساب شارژ کیف پول (رفاهستون)</h3>
                  <p className="text-sm text-muted-foreground">
                    در صورت خرید از رفاهستون، مشتری برای شارژ کیف پول به این حساب واریز می‌کند
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>شماره حساب</Label>
                      <Input
                        value={settings?.walletRechargeAccount?.accountNumber || ""}
                        onChange={(e) =>
                          settings &&
                          handleUpdateSettings({
                            ...settings,
                            walletRechargeAccount: {
                              ...settings.walletRechargeAccount,
                              accountNumber: e.target.value,
                              shebaNumber: settings.walletRechargeAccount?.shebaNumber || "",
                              bankName: settings.walletRechargeAccount?.bankName || "",
                              accountHolderName: settings.walletRechargeAccount?.accountHolderName || "",
                            },
                          })
                        }
                        placeholder="شماره حساب"
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>شماره شبا</Label>
                      <Input
                        value={settings?.walletRechargeAccount?.shebaNumber || ""}
                        onChange={(e) =>
                          settings &&
                          handleUpdateSettings({
                            ...settings,
                            walletRechargeAccount: {
                              ...settings.walletRechargeAccount,
                              accountNumber: settings.walletRechargeAccount?.accountNumber || "",
                              shebaNumber: e.target.value,
                              bankName: settings.walletRechargeAccount?.bankName || "",
                              accountHolderName: settings.walletRechargeAccount?.accountHolderName || "",
                            },
                          })
                        }
                        placeholder="IR..."
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>نام بانک</Label>
                      <Input
                        value={settings?.walletRechargeAccount?.bankName || ""}
                        onChange={(e) =>
                          settings &&
                          handleUpdateSettings({
                            ...settings,
                            walletRechargeAccount: {
                              ...settings.walletRechargeAccount,
                              accountNumber: settings.walletRechargeAccount?.accountNumber || "",
                              shebaNumber: settings.walletRechargeAccount?.shebaNumber || "",
                              bankName: e.target.value,
                              accountHolderName: settings.walletRechargeAccount?.accountHolderName || "",
                            },
                          })
                        }
                        placeholder="نام بانک"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>نام صاحب حساب</Label>
                      <Input
                        value={settings?.walletRechargeAccount?.accountHolderName || ""}
                        onChange={(e) =>
                          settings &&
                          handleUpdateSettings({
                            ...settings,
                            walletRechargeAccount: {
                              ...settings.walletRechargeAccount,
                              accountNumber: settings.walletRechargeAccount?.accountNumber || "",
                              shebaNumber: settings.walletRechargeAccount?.shebaNumber || "",
                              bankName: settings.walletRechargeAccount?.bankName || "",
                              accountHolderName: e.target.value,
                            },
                          })
                        }
                        placeholder="نام صاحب حساب"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">انواع وام</h3>
                    <Dialog open={isAddLoanTypeOpen} onOpenChange={setIsAddLoanTypeOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          افزودن نوع وام
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>افزودن نوع وام جدید</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>نام وام</Label>
                              <Input
                                value={newLoanType.name}
                                onChange={(e) => setNewLoanType({ ...newLoanType, name: e.target.value })}
                                placeholder="مثال: رسالت"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>هزینه اعتبارسنجی (تومان)</Label>
                              <Input
                                type="number"
                                value={newLoanType.creditCheckFee}
                                onChange={(e) => setNewLoanType({ ...newLoanType, creditCheckFee: e.target.value })}
                                placeholder="250000"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>نرخ کارمزد (%)</Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={newLoanType.commissionRate}
                                onChange={(e) => setNewLoanType({ ...newLoanType, commissionRate: e.target.value })}
                                placeholder="2.5"
                              />
                            </div>
                            <div className="space-y-2 flex items-center gap-2 pt-8">
                              <input
                                type="checkbox"
                                id="requiresGuarantors"
                                checked={newLoanType.requiresGuarantors}
                                onChange={(e) =>
                                  setNewLoanType({ ...newLoanType, requiresGuarantors: e.target.checked })
                                }
                                className="h-4 w-4"
                              />
                              <Label htmlFor="requiresGuarantors">نیاز به ضامن دارد</Label>
                            </div>
                          </div>
                          {newLoanType.requiresGuarantors && (
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>حداقل تعداد ضامن</Label>
                                <Input
                                  type="number"
                                  value={newLoanType.minGuarantors}
                                  onChange={(e) => setNewLoanType({ ...newLoanType, minGuarantors: e.target.value })}
                                  placeholder="1"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>حداکثر تعداد ضامن</Label>
                                <Input
                                  type="number"
                                  value={newLoanType.maxGuarantors}
                                  onChange={(e) => setNewLoanType({ ...newLoanType, maxGuarantors: e.target.value })}
                                  placeholder="2"
                                />
                              </div>
                            </div>
                          )}
                          <div className="space-y-2">
                            <Label>فیلدهای مورد نیاز (با کاما جدا کنید)</Label>
                            <Textarea
                              value={newLoanType.requiredFields}
                              onChange={(e) => setNewLoanType({ ...newLoanType, requiredFields: e.target.value })}
                              placeholder="نام، نام خانوادگی، کد ملی، شماره تماس"
                              rows={3}
                            />
                          </div>
                          {newLoanType.requiresGuarantors && (
                            <div className="space-y-2">
                              <Label>فیلدهای ضامن (با کاما جدا کنید)</Label>
                              <Textarea
                                value={newLoanType.guarantorFields}
                                onChange={(e) => setNewLoanType({ ...newLoanType, guarantorFields: e.target.value })}
                                placeholder="نام، نام خانوادگی، کد ملی، نسبت"
                                rows={3}
                              />
                            </div>
                          )}
                          <Button onClick={handleAddLoanType} className="w-full">
                            افزودن نوع وام
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  {settings?.loanTypes.map((loanType) => (
                    <Card key={loanType.id}>
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <h4 className="font-semibold">{loanType.name}</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">هزینه اعتبارسنجی:</span>{" "}
                                {loanType.creditCheckFee.toLocaleString()} تومان
                              </div>
                              <div>
                                <span className="text-muted-foreground">نرخ کارمزد:</span> {loanType.commissionRate}%
                              </div>
                              <div className="col-span-2">
                                <span className="text-muted-foreground">فیلدهای مورد نیاز:</span>{" "}
                                {(loanType.requiredFields || []).join("، ")}
                              </div>
                              {loanType.requiresGuarantors && (
                                <>
                                  <div className="col-span-2">
                                    <Badge variant="outline">
                                      نیاز به {loanType.minGuarantors} تا {loanType.maxGuarantors} ضامن
                                    </Badge>
                                  </div>
                                  <div className="col-span-2">
                                    <span className="text-muted-foreground">فیلدهای ضامن:</span>{" "}
                                    {(loanType.guarantorFields || []).join("، ")}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteLoanType(loanType.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Loan Details Dialog */}
      <Dialog open={isViewLoanOpen} onOpenChange={setIsViewLoanOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>جزئیات وام</DialogTitle>
            <DialogDescription>اطلاعات کامل درخواست وام</DialogDescription>
          </DialogHeader>
          {selectedLoan && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>مشتری</Label>
                  <p className="text-sm">{selectedLoan.customerName}</p>
                </div>
                <div>
                  <Label>کارمند</Label>
                  <p className="text-sm">{selectedLoan.agentName}</p>
                </div>
                <div>
                  <Label>نوع وام</Label>
                  <p className="text-sm">{selectedLoan.loanTypeName || "رسالت"}</p>
                </div>
                <div>
                  <Label>مبلغ وام</Label>
                  <p className="text-sm font-semibold">{(selectedLoan.amount || 0).toLocaleString()} تومان</p>
                </div>
                <div>
                  <Label>هزینه اعتبارسنجی</Label>
                  <p className="text-sm">{(selectedLoan.creditCheckFee || 0).toLocaleString()} تومان</p>
                </div>
                <div>
                  <Label>کارمزد</Label>
                  <p className="text-sm font-semibold text-green-500">
                    {(selectedLoan.commission || 0).toLocaleString()} تومان
                  </p>
                </div>
              </div>

              {/* Credit Check */}
              <div className="space-y-2">
                <h3 className="font-semibold">اعتبارسنجی</h3>
                <div className="flex items-center gap-2">
                  <Badge variant={selectedLoan.creditCheck?.paid ? "default" : "secondary"}>
                    {selectedLoan.creditCheck?.paid ? "پرداخت شده" : "پرداخت نشده"}
                  </Badge>
                  {selectedLoan.creditCheck?.receiptUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedLoan.creditCheck.receiptUrl} download target="_blank" rel="noopener noreferrer">
                        <Download className="ml-2 h-4 w-4" />
                        دانلود رسید
                      </a>
                    </Button>
                  )}
                </div>
                {selectedLoan.creditCheck?.formData && (
                  <div className="mt-2 p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">اطلاعات اعتبارسنجی:</p>
                    {Object.entries(selectedLoan.creditCheck.formData).map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <span className="font-medium">{key}:</span> {value}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">مدارک مشتری</h3>
                {selectedLoan.documents?.filter((d) => d.category === "customer").length > 0 ? (
                  <div className="space-y-2">
                    {selectedLoan.documents
                      .filter((d) => d.category === "customer")
                      .map((doc, index) => (
                        <Card key={doc.id || index}>
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium">{doc.name || `مدرک ${index + 1}`}</p>
                                <p className="text-xs text-muted-foreground">
                                  {doc.uploadedAt
                                    ? new Date(doc.uploadedAt).toLocaleDateString("fa-IR")
                                    : "تاریخ نامشخص"}
                                </p>
                              </div>
                              <Button variant="outline" size="sm" asChild>
                                <a href={doc.url} download target="_blank" rel="noopener noreferrer">
                                  <Download className="ml-2 h-4 w-4" />
                                  دانلود
                                </a>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">هیچ مدرکی بارگذاری نشده است</p>
                )}
              </div>

              {selectedLoan.guarantors && selectedLoan.guarantors.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">ضامن‌ها و مدارک آن‌ها</h3>
                  {selectedLoan.guarantors.map((guarantor, gIndex) => (
                    <Card key={guarantor.id}>
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b">
                          <h4 className="font-medium">ضامن {gIndex + 1}</h4>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={
                                guarantor.status === "approved"
                                  ? "bg-green-500/10 text-green-500 border-green-500/20"
                                  : guarantor.status === "rejected"
                                    ? "bg-red-500/10 text-red-500 border-red-500/20"
                                    : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                              }
                            >
                              {guarantor.status === "approved"
                                ? "تایید شده"
                                : guarantor.status === "rejected"
                                  ? "رد شده"
                                  : "در انتظار تایید"}
                            </Badge>
                            {guarantor.status !== "approved" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-500 border-green-500 hover:bg-green-500/10 bg-transparent"
                                onClick={() => {
                                  const updatedLoans = loans.map((loan) =>
                                    loan.id === selectedLoan.id
                                      ? {
                                          ...loan,
                                          guarantors: loan.guarantors.map((g) =>
                                            g.id === guarantor.id ? { ...g, status: "approved" as const } : g,
                                          ),
                                          updatedAt: new Date().toISOString(),
                                        }
                                      : loan,
                                  )
                                  setLoans(updatedLoans)
                                  localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(updatedLoans))
                                  setSelectedLoan(updatedLoans.find((l) => l.id === selectedLoan.id) || selectedLoan)
                                }}
                              >
                                تایید
                              </Button>
                            )}
                            {guarantor.status !== "rejected" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-500 border-red-500 hover:bg-red-500/10 bg-transparent"
                                onClick={() => {
                                  const updatedLoans = loans.map((loan) =>
                                    loan.id === selectedLoan.id
                                      ? {
                                          ...loan,
                                          guarantors: loan.guarantors.map((g) =>
                                            g.id === guarantor.id ? { ...g, status: "rejected" as const } : g,
                                          ),
                                          updatedAt: new Date().toISOString(),
                                        }
                                      : loan,
                                  )
                                  setLoans(updatedLoans)
                                  localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(updatedLoans))
                                  setSelectedLoan(updatedLoans.find((l) => l.id === selectedLoan.id) || selectedLoan)
                                }}
                              >
                                رد
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm pb-2 border-b">
                          <div>
                            <span className="font-medium">نام:</span> {guarantor.name}
                          </div>
                          <div>
                            <span className="font-medium">تلفن:</span> {guarantor.phone}
                          </div>
                          <div>
                            <span className="font-medium">کد ملی:</span> {guarantor.nationalId}
                          </div>
                          <div>
                            <span className="font-medium">نسبت:</span> {guarantor.relationship}
                          </div>
                        </div>
                        {guarantor.formData && Object.keys(guarantor.formData).length > 0 && (
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm font-medium mb-2">اطلاعات تکمیلی:</p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {Object.entries(guarantor.formData).map(([key, value]) => (
                                <div key={key}>
                                  <span className="font-medium">{key}:</span> {value}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium mb-2">مدارک ضامن:</p>
                          {guarantor.documents && guarantor.documents.length > 0 ? (
                            <div className="space-y-2">
                              {guarantor.documents.map((doc, dIndex) => (
                                <div
                                  key={doc.id || dIndex}
                                  className="flex items-center justify-between p-2 bg-muted rounded"
                                >
                                  <span className="text-sm">{doc.name || `مدرک ${dIndex + 1}`}</span>
                                  <Button variant="ghost" size="sm" asChild>
                                    <a href={doc.url} download target="_blank" rel="noopener noreferrer">
                                      <Download className="h-4 w-4" />
                                    </a>
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">هیچ مدرکی بارگذاری نشده است</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                <h3 className="font-semibold">قرارداد، چک‌ها و رسیدها</h3>
                <div className="grid gap-2">
                  {selectedLoan.contract?.fileUrl && (
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">فایل قرارداد</span>
                          <Button variant="outline" size="sm" asChild>
                            <a href={selectedLoan.contract.fileUrl} download target="_blank" rel="noopener noreferrer">
                              <Download className="ml-2 h-4 w-4" />
                              دانلود
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {selectedLoan.contract?.guaranteeCheckUrl && (
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">چک تضمین</span>
                          <Button variant="outline" size="sm" asChild>
                            <a
                              href={selectedLoan.contract.guaranteeCheckUrl}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Download className="ml-2 h-4 w-4" />
                              دانلود
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {selectedLoan.contract?.feeReceiptUrl && (
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">رسید واریز امتیاز</span>
                          <Button variant="outline" size="sm" asChild>
                            <a
                              href={selectedLoan.contract.feeReceiptUrl}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Download className="ml-2 h-4 w-4" />
                              دانلود
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {selectedLoan.contract?.releaseOrderUrl && (
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">دستور آزادسازی</span>
                          <Button variant="outline" size="sm" asChild>
                            <a
                              href={selectedLoan.contract.releaseOrderUrl}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Download className="ml-2 h-4 w-4" />
                              دانلود
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {selectedLoan.contract?.checkReturnReceiptUrl && (
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">رسید عودت چک</span>
                          <Button variant="outline" size="sm" asChild>
                            <a
                              href={selectedLoan.contract.checkReturnReceiptUrl}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Download className="ml-2 h-4 w-4" />
                              دانلود
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {!selectedLoan.contract?.fileUrl &&
                    !selectedLoan.contract?.guaranteeCheckUrl &&
                    !selectedLoan.contract?.feeReceiptUrl &&
                    !selectedLoan.contract?.releaseOrderUrl &&
                    !selectedLoan.contract?.checkReturnReceiptUrl && (
                      <p className="text-sm text-muted-foreground">هیچ فایلی بارگذاری نشده است</p>
                    )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
