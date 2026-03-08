"use client"

import { useEffect, useState, useCallback } from "react"

interface DeptQueue {
  dno: number
  name: string
  currentCode: string
  waitTime: string
  waiting: number
  total: number
}

const BORDER_COLORS: { [key: number]: string } = {
  1: "border-blue-500",
  2: "border-purple-500",
  3: "border-yellow-500",
  4: "border-pink-500",
  5: "border-red-500",
  6: "border-green-600",
}

type QueueCardProps = {
  title: string
  code: string
  wait: string
  waiting: number
  borderColor: string
}

function QueueCard({
  title,
  code,
  wait,
  waiting,
  borderColor,
}: QueueCardProps) {
  return (
    <div
      className={`bg-white rounded-2xl p-5 shadow-md border-l-8 ${borderColor}`}
    >
      <h2 className="text-gray-700 font-semibold text-lg mb-3">
        {title}
      </h2>

      <div className="bg-gray-100 rounded-xl p-4 text-center mb-3">
        <p className="text-sm text-gray-500">คิวปัจจุบัน</p>
        <p className="text-3xl font-bold text-green-600">{code}</p>
      </div>

      <div className="bg-orange-100 text-orange-600 text-sm text-center py-2 rounded-lg mb-3">
        รอประมาณ {wait}
      </div>

      <div className="flex justify-center text-xs text-gray-500">
        <div className="text-center">
          <p className="font-bold text-black text-lg">{waiting}</p>
          <p>คิวที่รอตรวจ</p>
        </div>
      </div>
    </div>
  )
}

export default function QueuePage() {
  const [queues, setQueues] = useState<DeptQueue[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string>("")

  const fetch_queues = useCallback(async () => {
    try {
      const res = await fetch("/api/queue")
      const data = await res.json()
      if (data.success) {
        setQueues(data.data)
        setLastUpdate(new Date().toLocaleTimeString("th-TH"))
      }
    } catch (error) {
      console.error("Fetch error:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch_queues()
    // อัพเดททุก 30 วินาที
    const interval = setInterval(fetch_queues, 30000)
    return () => clearInterval(interval)
  }, [fetch_queues])

  if (loading) {
    return (
      <div className="min-h-screen bg-green-100 flex justify-center items-center">
        <p className="text-green-700 text-xl">กำลังโหลดข้อมูลคิว...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex justify-center py-10" style={{ background: "#F7FFF4" }}>
      <div className="w-full max-w-5xl rounded-3xl p-8 shadow-xl" style={{ background: "#D6FBEC" }}>
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold" style={{ color: "#47AD84" }}>คิวเรียลไทม์</h1>
          <p className="text-sm" style={{ color: "#47AD84" }}>อัปเดตล่าสุด: {lastUpdate} (ทุก 30 วินาที)</p>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {queues.map((dept) => (
            <QueueCard
              key={dept.dno}
              title={dept.name}
              code={dept.currentCode}
              wait={dept.waitTime}
              waiting={dept.waiting}
              borderColor={BORDER_COLORS[dept.dno] || "border-gray-500"}
            />
          ))}
        </div>

        {queues.length === 0 && (
          <div className="text-center text-gray-600 py-10">
            <p className="text-5xl mb-4">📋</p>
            <p>ยังไม่มีคิววันนี้</p>
          </div>
        )}
      </div>
    </div>
  )
}