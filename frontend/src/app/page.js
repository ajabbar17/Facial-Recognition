
import Link from "next/link";
import { UserPlus, ScanFace, ClipboardList } from "lucide-react";

const cards = [
  {
    title: "Take Attendance",
    description: "Scan and mark attendance using facial recognition.",
    icon: <ScanFace className="w-8 h-8 text-blue-600" />,
    href: "/take-attendance",
  },
  {
    title: "Register",
    description: "Register a new face for the attendance system.",
    icon: <UserPlus className="w-8 h-8 text-green-600" />,
    href: "/register",
  },
  {
    title: "Check Attendance",
    description: "View and manage attendance records.",
    icon: <ClipboardList className="w-8 h-8 text-purple-600" />,
    href: "/attendance",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white px-4 py-10">
      <h1 className="text-3xl font-bold text-center mb-12 text-gray-800">
        Facial Recognition Attendance System
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="border rounded-2xl p-6 shadow hover:shadow-xl hover:scale-105 transition duration-200 bg-white hover:bg-gray-50"
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-4">{card.icon}</div>
              <h2 className="text-xl font-semibold text-gray-700">
                {card.title}
              </h2>
              <p className="text-sm text-gray-500 mt-2">{card.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
