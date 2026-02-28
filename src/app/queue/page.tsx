"use client"

type QueueCardProps = {
  title: string
  code: string
  wait: string
  left: number
  processing: number
  total: number
  borderColor: string
}

function QueueCard({
  title,
  code,
  wait,
  left,
  processing,
  total,
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

      <div className="flex justify-between text-xs text-gray-500">
        <div className="text-center">
          <p className="font-bold text-black">{left}</p>
          <p>รอคิว</p>
        </div>
        <div className="text-center">
          <p className="font-bold text-black">{processing}</p>
          <p>กำลังตรวจ</p>
        </div>
        <div className="text-center">
          <p className="font-bold text-black">{total}</p>
          <p>ทั้งหมด</p>
        </div>
      </div>
    </div>
  )
}

export default function QueuePage() {
  return (
    <div className="min-h-screen bg-green-100 flex justify-center py-10">
      <div className="bg-green-200 w-full max-w-5xl rounded-3xl p-8 shadow-xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-700">คิวเรียลไทม์</h1>
          <p className="text-green-600 text-sm">อัปเดตทุก 30 วินาที</p>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <QueueCard
            title="อายุรกรรม"
            code="A14"
            wait="30 นาที"
            left={9}
            processing={13}
            total={23}
            borderColor="border-blue-500"
          />

          <QueueCard
            title="ศัลยกรรม"
            code="B09"
            wait="45 นาที"
            left={2}
            processing={8}
            total={11}
            borderColor="border-purple-500"
          />

          <QueueCard
            title="ทันตกรรม"
            code="C22"
            wait="20 นาที"
            left={6}
            processing={21}
            total={28}
            borderColor="border-green-500"
          />

          <QueueCard
            title="กุมารเวชกรรม"
            code="D05"
            wait="25 นาที"
            left={2}
            processing={4}
            total={7}
            borderColor="border-yellow-500"
          />

          <QueueCard
            title="ศัลยกรรมกระดูก"
            code="E06"
            wait="50 นาที"
            left={4}
            processing={6}
            total={10}
            borderColor="border-red-500"
          />

          <QueueCard
            title="ตรวจสุขภาพ"
            code="F15"
            wait="20 นาที"
            left={8}
            processing={14}
            total={23}
            borderColor="border-green-600"
          />
        </div>
      </div>
    </div>
  )
}