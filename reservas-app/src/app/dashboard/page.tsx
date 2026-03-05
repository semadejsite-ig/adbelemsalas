'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { format, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { PlusCircle, LogOut, Edit, CalendarIcon, ListIcon, MoreVertical, MoreHorizontal } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export default function DashboardClient() {
    const supabase = createClient()
    const router = useRouter()

    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [reservations, setReservations] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [date, setDate] = useState<Date | undefined>(new Date())

    useEffect(() => {
        async function loadData() {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login')
                return
            }
            setUser(user)

            // Buscar perfil
            const { data: profData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            setProfile(profData)

            // Buscar reservas a partir de hoje
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            const { data: resData, error } = await supabase
                .from('reservations')
                .select(`
                    *,
                    rooms (name),
                    profiles (full_name, department)
                `)
                .gte('start_time', today.toISOString())
                .order('start_time', { ascending: true })

            if (error) {
                toast.error('Erro ao carregar reservas.')
            } else {
                setReservations(resData || [])
            }

            setIsLoading(false)
        }

        loadData()
    }, [supabase, router])

    async function handleLogout() {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center p-4">Carregando painel...</div>
    }

    // ========== PROCESSAMENTOS DE DADOS ============

    // "Minhas Reservas" para colocar a bolinha e avisar do choque visualmente (Dias Ocupados no Geral)
    const ocupiedDates = reservations.map(r => new Date(r.start_time))

    // Filtrar reservas pro dia especifico clicado no calendario
    const selectedDateReservations = reservations.filter(res => {
        if (!date) return false
        return isSameDay(new Date(res.start_time), date)
    })

    return (
        <div className="flex h-screen w-full flex-col p-4 max-w-md mx-auto relative bg-background">
            <header className="flex justify-between items-center py-2 shrink-0">
                <div className="flex items-center space-x-3">
                    <Image
                        src="/LOGO OFICIAL ADBELEMSJC.png"
                        alt="ADBelém"
                        width={40}
                        height={40}
                        className="object-contain"
                    />
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">ADBelém Salas</h1>
                        <p className="text-sm text-muted-foreground">Olá, {profile?.full_name?.split(' ')[0]}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/salas">Salas</Link>
                    </Button>
                    <form action={handleLogout}>
                        <Button variant="ghost" size="icon" type="submit">
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </form>
                </div>
            </header>

            <Tabs defaultValue="agenda" className="flex-1 flex flex-col mt-4 min-h-0">
                <TabsList className="grid w-full grid-cols-2 shrink-0 bg-muted/50 p-1">
                    <TabsTrigger value="agenda" className="text-xs sm:text-sm font-medium rounded-sm">
                        <ListIcon className="w-4 h-4 mr-2" />
                        Agenda
                    </TabsTrigger>
                    <TabsTrigger value="calendario" className="text-xs sm:text-sm font-medium rounded-sm">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        Calendário
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="agenda" className="flex-1 overflow-y-auto mt-4 pb-20 space-y-3">
                    {reservations.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            <p>Nenhuma reserva futura.</p>
                        </div>
                    ) : (
                        reservations.map((res) => (
                            <div key={res.id} className="group relative flex border rounded-lg p-3 shadow-sm bg-card transition hover:border-sidebar-accent">
                                {/* Decorator Line (Ocupou o lugar do background escuro grosso em cima) */}
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary rounded-l-lg" />

                                <div className="ml-2 flex flex-col justify-center items-center px-3 border-r pr-4 mr-4 min-w-[70px]">
                                    <span className="text-xs text-muted-foreground font-semibold uppercase">{format(new Date(res.start_time), "MMM", { locale: ptBR })}</span>
                                    <span className="text-xl font-bold">{format(new Date(res.start_time), "dd")}</span>
                                </div>

                                <div className="flex-1 flex flex-col justify-center py-1">
                                    <h3 className="text-sm font-bold text-foreground leading-tight">{res.rooms?.name}</h3>
                                    <span className="text-xs text-muted-foreground block truncate max-w-[180px] sm:max-w-full">
                                        {format(new Date(res.start_time), 'HH:mm')} - {format(new Date(res.end_time), 'HH:mm')} • {res.title}
                                    </span>
                                </div>

                                <div className="flex flex-col items-end justify-between pl-2 shrink-0">
                                    {res.user_id === user?.id ? (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0" aria-label="Ações da reserva">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/reserva/${res.id}`} className="cursor-pointer">
                                                        <Edit className="w-4 h-4 mr-2" />
                                                        Editar Minha Reserva
                                                    </Link>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    ) : (
                                        <div className="h-8 w-8" />
                                    )}
                                    <span className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded shadow-sm text-center max-w-[80px] truncate">
                                        {res.profiles?.department}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </TabsContent>

                <TabsContent value="calendario" className="flex-1 overflow-y-auto mt-4 pb-20 flex flex-col items-center space-y-6">
                    <Card className="shadow-sm p-2 rounded-2xl w-fit">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            locale={ptBR}
                            className="p-3 bg-card"
                            modifiers={{
                                booked: ocupiedDates,
                            }}
                            modifiersClassNames={{
                                booked: "font-bold text-primary underline decoration-2 underline-offset-4 decoration-primary",
                            }}
                        />
                    </Card>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center border-b pb-2 px-1">
                            <h3 className="font-semibold text-sm">
                                Agendamentos do dia {date ? format(date, "d 'de' MMMM", { locale: ptBR }) : ''}
                            </h3>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                                {selectedDateReservations.length} eventos
                            </span>
                        </div>

                        {selectedDateReservations.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm bg-muted/10 rounded-lg">
                                Nenhuma sala reservada para este dia.
                            </div>
                        ) : (
                            selectedDateReservations.map((res) => (
                                <div key={res.id} className="flex flex-col border rounded-md p-3 shadow-sm bg-muted/20">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-sm text-primary">{res.rooms?.name}</h4>
                                            <p className="text-xs text-foreground mt-0.5">{res.title}</p>
                                        </div>
                                        <span className="text-[10px] font-semibold bg-secondary px-2 py-1 rounded">
                                            {format(new Date(res.start_time), 'HH:mm')} às {format(new Date(res.end_time), 'HH:mm')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center mt-3 pt-2 text-xs text-muted-foreground border-t">
                                        <span>{res.profiles?.full_name?.split(' ')[0]} ({res.profiles?.department})</span>
                                        {res.user_id === user?.id && (
                                            <Link href={`/reserva/${res.id}`} className="text-primary hover:underline font-medium">
                                                Editar
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Flutuante "Nova Reserva" */}
            <div className="fixed bottom-6 right-0 left-0 flex justify-center px-4 pointer-events-none z-50">
                <Button asChild size="lg" className="rounded-full shadow-2xl h-14 px-8 pointer-events-auto bg-primary text-primary-foreground hover:bg-primary/90 font-bold tracking-wide">
                    <Link href="/reserva">
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Nova Reserva
                    </Link>
                </Button>
            </div>
        </div>
    )
}
