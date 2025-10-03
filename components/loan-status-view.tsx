"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle, Clock, XCircle } from "lucide-react"
import type { Loan } from "@/lib/auth"

interface LoanStatusViewProps {
  loan: Loan
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoanStatusView({ loan, open, onOpenChange }: LoanStatusViewProps) {
  const approvedGuarantors = loan.guarantors.filter((g) => g.status === "approved").length
  const rejectedGuarantors = loan.guarantors.filter((g) => g.status === "rejected").length
  const pendingGuarantors = loan.guarantors.filter((g) => !g.status || g.status === "pending").length
  const totalGuarantors = loan.guarantors.length

  const stages = [
    { id: "created", label: "ثبت درخواست", status: "completed" },
    {
      id: "credit_check",
      label: "پرداخت هزینه اعتبارسنجی",
      status: loan.creditCheck.paid ? "completed" : "pending",
    },
    {
      id: "documents",
      label: "بارگذاری مدارک",
      status: loan.documents.length > 0 ? "completed" : "pending",
    },
    {
      id: "guarantors",
      label: "معرفی ضامن",
      status:
        loan.guarantors.length >= (loan.loanType ? 1 : 0)
          ? "completed"
          : loan.guarantors.length > 0
            ? "in_progress"
            : "pending",
      required: loan.guarantors.length > 0,
    },
    {
      id: "guarantor_approval",
      label: "تایید ضامن‌ها",
      status:
        totalGuarantors === 0
          ? "pending"
          : rejectedGuarantors > 0
            ? "rejected"
            : approvedGuarantors === totalGuarantors
              ? "completed"
              : approvedGuarantors > 0
                ? "in_progress"
                : "pending",
      required: totalGuarantors > 0,
    },
    {
      id: "review",
      label: "بررسی توسط مدیر",
      status: loan.status === "under_review" ? "in_progress" : loan.status === "approved" ? "completed" : "pending",
    },
    {
      id: "approval",
      label: "تایید نهایی",
      status: loan.status === "approved" ? "completed" : loan.status === "rejected" ? "rejected" : "pending",
    },
    {
      id: "contract",
      label: "ارسال قرارداد",
      status: loan.contract.fileUrl ? "completed" : "pending",
    },
    {
      id: "disbursement",
      label: "پرداخت وام",
      status: loan.status === "disbursed" ? "completed" : "pending",
    },
    {
      id: "completed",
      label: "تکمیل",
      status: loan.status === "completed" ? "completed" : "pending",
    },
  ]

  const getStageIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "in_progress":
        return <Clock className="h-5 w-5 text-blue-500" />
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Circle className="h-5 w-5 text-gray-300" />
    }
  }

  const getStageColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-500"
      case "in_progress":
        return "text-blue-500"
      case "rejected":
        return "text-red-500"
      default:
        return "text-gray-400"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>وضعیت وام - {loan.customerName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Loan Info */}
          <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-muted/50 p-4">
            <div>
              <p className="text-sm text-muted-foreground">نوع وام</p>
              <p className="font-medium">{loan.loanTypeName || "نامشخص"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">مبلغ</p>
              <p className="font-medium">{(loan.amount || 0).toLocaleString()} تومان</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">وضعیت کلی</p>
              <Badge
                variant="outline"
                className={
                  loan.status === "approved"
                    ? "bg-green-500/10 text-green-500"
                    : loan.status === "rejected"
                      ? "bg-red-500/10 text-red-500"
                      : "bg-blue-500/10 text-blue-500"
                }
              >
                {loan.status === "pending"
                  ? "در انتظار"
                  : loan.status === "under_review"
                    ? "در حال بررسی"
                    : loan.status === "approved"
                      ? "تایید شده"
                      : loan.status === "rejected"
                        ? "رد شده"
                        : loan.status === "disbursed"
                          ? "پرداخت شده"
                          : "تکمیل شده"}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">تاریخ ثبت</p>
              <p className="font-medium">{new Date(loan.createdAt).toLocaleDateString("fa-IR")}</p>
            </div>
          </div>

          {/* Progress Timeline */}
          <div className="space-y-4">
            <h3 className="font-semibold">مراحل پیشرفت</h3>
            <div className="space-y-3">
              {stages.map((stage, index) => (
                <div key={stage.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    {getStageIcon(stage.status)}
                    {index < stages.length - 1 && (
                      <div
                        className={`mt-1 h-8 w-0.5 ${stage.status === "completed" ? "bg-green-500" : "bg-gray-300"}`}
                      />
                    )}
                  </div>
                  <div className="flex-1 pb-2">
                    <p className={`font-medium ${getStageColor(stage.status)}`}>{stage.label}</p>
                    {stage.status === "in_progress" && <p className="text-sm text-muted-foreground">در حال انجام...</p>}
                    {stage.status === "pending" && <p className="text-sm text-muted-foreground">در انتظار</p>}
                    {stage.status === "completed" && <p className="text-sm text-green-600">تکمیل شده</p>}
                    {stage.status === "rejected" && <p className="text-sm text-red-600">رد شده</p>}
                    {stage.id === "guarantor_approval" && totalGuarantors > 0 && (
                      <div className="mt-1 flex gap-2 text-xs">
                        {approvedGuarantors > 0 && (
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                            {approvedGuarantors} تایید شده
                          </Badge>
                        )}
                        {pendingGuarantors > 0 && (
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                            {pendingGuarantors} در انتظار
                          </Badge>
                        )}
                        {rejectedGuarantors > 0 && (
                          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                            {rejectedGuarantors} رد شده
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Info */}
          <div className="space-y-2 rounded-lg border border-border bg-muted/50 p-4">
            <h4 className="font-semibold">اطلاعات تکمیلی</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">تعداد مدارک: </span>
                <span className="font-medium">{loan.documents.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">تعداد ضامن: </span>
                <span className="font-medium">{loan.guarantors.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">هزینه اعتبارسنجی: </span>
                <span className="font-medium">{(loan.creditCheckFee || 0).toLocaleString()} تومان</span>
              </div>
              <div>
                <span className="text-muted-foreground">کارمزد: </span>
                <span className="font-medium">{(loan.commission || 0).toLocaleString()} تومان</span>
              </div>
            </div>
          </div>

          {loan.guarantors.length > 0 && (
            <div className="space-y-2 rounded-lg border border-border bg-muted/50 p-4">
              <h4 className="font-semibold">وضعیت ضامن‌ها</h4>
              <div className="space-y-2">
                {loan.guarantors.map((guarantor, index) => (
                  <div
                    key={guarantor.id}
                    className="flex items-center justify-between text-sm p-2 rounded bg-background"
                  >
                    <div>
                      <p className="font-medium">
                        {index + 1}. {guarantor.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{guarantor.relationship}</p>
                    </div>
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
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
