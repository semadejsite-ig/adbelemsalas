import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { PlusCircle, ArrowLeft, Users, CheckCircle2, XCircle } from 'lucide-react'

export default async function SalasPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Buscar todas as salas
    const { data: rooms } = await supabase
        .from('rooms')
        .select('*')
        .order('name', { ascending: true })

    return (
        <div className="flex h-screen w-full flex-col p-4 space-y-4 max-w-md mx-auto">
            <header className="flex items-center py-2 space-x-2">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <h1 className="text-xl font-bold tracking-tight">Gerenciar Salas</h1>
            </header>

            <main className="flex-1 overflow-y-auto space-y-4 pb-16">
                {rooms?.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                        <p>Nenhuma sala cadastrada.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {rooms?.map((room) => (
                            <Card key={room.id} className={`overflow-hidden ${!room.is_active ? 'opacity-60 grayscale' : ''}`}>
                                <CardHeader className="py-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-base flex items-center gap-2">
                                                {room.name}
                                                {room.is_active ? (
                                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                ) : (
                                                    <XCircle className="w-4 h-4 text-red-500" />
                                                )}
                                            </CardTitle>
                                            <CardDescription className="flex items-center mt-1">
                                                <Users className="w-4 h-4 mr-1" /> Capacidade: {room.capacity}
                                            </CardDescription>
                                        </div>
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/salas/${room.id}`}>Editar</Link>
                                        </Button>
                                    </div>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            {/* Flutuante "Nova Sala" */}
            <div className="fixed bottom-6 right-0 left-0 flex justify-center px-4 pointer-events-none">
                <Button asChild size="lg" className="rounded-full shadow-lg h-14 px-6 pointer-events-auto">
                    <Link href="/salas/nova">
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Nova Sala
                    </Link>
                </Button>
            </div>
        </div>
    )
}
