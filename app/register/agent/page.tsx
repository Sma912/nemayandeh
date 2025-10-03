"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { STORAGE_KEYS, type User } from "@/lib/auth"
import { normalizePhoneNumber } from "@/lib/phone-utils"

export default function RegisterAgentPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [nationalId, setNationalId] = useState("")
  const [workDomain, setWorkDomain] = useState("")
  const [workExperienceYears, setWorkExperienceYears] = useState("")
  const [address, setAddress] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [phone, setPhone] = useState("")
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const contractText = `📜 شرایط و مقررات استفاده از خدمات سامانه

با ثبت‌نام و استفاده از خدمات این سامانه، کاربران (نمایندگان، مشتریان و ضامنین) متعهد می‌شوند که مفاد زیر را به‌طور کامل مطالعه کرده و پذیرفته‌اند.

۱. تعاریف

شرکت: مالک و بهره‌بردار سامانه.

نماینده: فردی که با قرارداد رسمی با شرکت همکاری می‌کند و وظیفه جذب مشتری و انجام مراحل اولیه پرونده را بر عهده دارد.

مشتری: فردی که متقاضی دریافت تسهیلات بانکی است.

ضامن: شخصی که جهت تضمین بازپرداخت تسهیلات معرفی می‌شود.

سرمایه‌گذار: فردی که امتیاز تسهیلات خود را به شرکت واگذار می‌نماید.

۲. موضوع فعالیت

ایجاد بستر آنلاین جهت معرفی مشتریان به بانک رسالت و پیگیری مراحل دریافت تسهیلات.

تسهیل فرآیند انتقال امتیاز تسهیلات از سرمایه‌گذاران به مشتریان.

ارائه خدمات پشتیبانی، اطلاع‌رسانی و قرارداد آنلاین در سامانه.

۳. تعهدات کاربران

کاربران موظف به ارائه اطلاعات صحیح و کامل در هنگام ثبت‌نام و بارگذاری مدارک هستند.

هرگونه استفاده نادرست از اطلاعات سایر کاربران، پیگرد قانونی خواهد داشت.

مشتریان و ضامنین مکلف‌اند اسناد و مدارک لازم (از جمله چک ضمانت) را طبق مقررات ارائه نمایند.

نمایندگان موظف‌اند مطابق ضوابط شرکت عمل کرده و از سوءاستفاده یا فعالیت خارج از چارچوب خودداری کنند.

۴. تعهدات شرکت

حفظ محرمانگی اطلاعات کاربران.

ایجاد زیرساخت فنی و حقوقی برای ثبت و پیگیری پرونده‌ها.

تسویه حساب کارمزد نمایندگان طبق زمان‌بندی اعلام‌شده.

اطلاع‌رسانی شفاف به مشتریان در خصوص وضعیت پرونده.

۵. کارمزد و هزینه‌ها

هزینه اعتبارسنجی برای هر نفر مبلغ ۲۵۰,۰۰۰ ریال است که توسط مشتری پرداخت می‌شود.

هزینه انتقال امتیاز تسهیلات مطابق نرخ روز محاسبه و به اطلاع مشتری می‌رسد.

نمایندگان کارمزد خود را به‌صورت درصدی از هزینه امتیاز دریافت خواهند کرد.

۶. ضمانت و ریسک‌ها

مسئولیت بازپرداخت اقساط تسهیلات صرفاً بر عهده مشتری و ضامن است.

شرکت در قبال عدم پرداخت اقساط یا نکول مشتری تعهدی ندارد.

به منظور تضمین حسن انجام کار، نماینده موظف به ارائه چک ضمانت به شرکت است.

۷. فسخ و محدودیت

در صورت نقض قوانین سامانه توسط هر کاربر، شرکت حق تعلیق یا قطع دسترسی وی را دارد.

قرارداد نمایندگان در صورت تخلف، یک‌طرفه از سوی شرکت فسخ خواهد شد.

۸. حل اختلاف

در صورت بروز اختلاف، ابتدا موضوع از طریق مذاکره حل‌وفصل می‌شود و در صورت عدم نتیجه، مراجع قضایی جمهوری اسلامی ایران صالح به رسیدگی خواهند بود.

۹. تغییرات

شرکت حق دارد در هر زمان شرایط و مقررات سامانه را تغییر دهد. تغییرات از طریق سایت اطلاع‌رسانی خواهد شد و ادامه استفاده کاربران به منزله پذیرش شرایط جدید است.`

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"
    let password = ""
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!firstName || !lastName || !nationalId || !workDomain || !address || !postalCode || !phone) {
      setError("لطفاً همه فیلدها را تکمیل کنید")
      return
    }
    setStep(2)
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!accepted) {
      setError("برای ادامه لازم است مقررات را تایید کنید")
      return
    }

    setLoading(true)
    try {
      const normalizedPhone = normalizePhoneNumber(phone)
      const usersData = localStorage.getItem(STORAGE_KEYS.USERS)
      const users: User[] = usersData ? JSON.parse(usersData) : []

      if (users.some((u) => u.phone && normalizePhoneNumber(u.phone) === normalizedPhone)) {
        setLoading(false)
        setError("کاربری با این شماره موبایل موجود است")
        return
      }

      const password = generatePassword()
      const nowIso = new Date().toISOString()

      // Save contract text as a data URL on-demand (store text; generate URL later)
      const newAgent: User = {
        id: `agent-${Date.now()}`,
        phone: normalizedPhone,
        name: `${firstName} ${lastName}`,
        role: "agent",
        createdAt: nowIso,
        password,
        isActive: true,
        firstName,
        lastName,
        nationalId,
        workDomain,
        workExperienceYears: Number(workExperienceYears || 0),
        address,
        postalCode,
        // Store raw text; we will generate a downloadable file when needed
        contractUrl: `text:contract`,
      }

      const updated = [
        ...users,
        newAgent,
      ]
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated))

      // Also store the contract text in localStorage per user for later rendering
      localStorage.setItem(`contract-text-${newAgent.id}`, contractText)

      setLoading(false)
      // Redirect to login with info note
      router.push("/login")
    } catch (err) {
      console.error(err)
      setLoading(false)
      setError("خطا در ثبت‌نام. دوباره تلاش کنید")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="flex flex-col items-center space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">ثبت‌نام کارمند</h1>
          <p className="text-sm text-muted-foreground">اطلاعات اولیه را تکمیل کنید و مقررات را تایید نمایید</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>مرحله {step === 1 ? "۱: اطلاعات" : "۲: مقررات و قرارداد"}</CardTitle>
            <CardDescription>
              {step === 1 ? "نام، اطلاعات هویتی و تماس را وارد کنید" : "متن قرارداد را مطالعه و تایید کنید"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 ? (
              <form onSubmit={handleNext} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>نام</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div>
                  <Label>نام خانوادگی</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
                <div>
                  <Label>کد ملی</Label>
                  <Input value={nationalId} onChange={(e) => setNationalId(e.target.value)} required />
                </div>
                <div>
                  <Label>حوزه کاری</Label>
                  <Input value={workDomain} onChange={(e) => setWorkDomain(e.target.value)} required />
                </div>
                <div>
                  <Label>سابقه کار (سال)</Label>
                  <Input type="number" value={workExperienceYears} onChange={(e) => setWorkExperienceYears(e.target.value)} />
                </div>
                <div>
                  <Label>شماره موبایل (نام کاربری)</Label>
                  <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </div>
                <div className="md:col-span-2">
                  <Label>آدرس پستی</Label>
                  <Textarea rows={3} value={address} onChange={(e) => setAddress(e.target.value)} required />
                </div>
                <div>
                  <Label>کد پستی</Label>
                  <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required />
                </div>
                {error && (
                  <div className="md:col-span-2">
                    <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
                  </div>
                )}
                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit">ادامه</Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Label>متن قرارداد</Label>
                  <Textarea className="mt-2" rows={10} value={contractText} readOnly />
                </div>
                <div className="flex items-center gap-2">
                  <input id="accept" type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
                  <Label htmlFor="accept">مفاد قرارداد را مطالعه کرده و می‌پذیرم</Label>
                </div>
                {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>بازگشت</Button>
                  <Button type="submit" disabled={loading}>{loading ? "در حال ثبت..." : "تایید و ثبت"}</Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


