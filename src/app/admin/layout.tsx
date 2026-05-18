import { Sidebar } from '@/components/Sidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-950 flex">
            <Sidebar />
            <div className="flex-1 md:pl-52 min-h-screen">
                {children}
            </div>
        </div>
    )
}
