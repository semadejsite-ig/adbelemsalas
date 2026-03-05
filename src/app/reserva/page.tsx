'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createReservation } from './actions'
import Link from 'next/link'
import { ArrowLeft, Clock, Info } from 'lucide-react'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function getWeekOfMonthOrdinal(date: Date) {
    const day = date.getDate();
    const nth = Math.ceil(day / 7);
    const m = date.getMonth();

    // Check if it's the last one of the month
    const d = new Date(date);
    d.setDate(d.getDate() + 7);
    const isLast = d.getMonth() !== m;

    const ordinals = ['primeiro', 'segundo', 'terceiro', 'quarto', 'quinto'];
    if (isLast) return 'último';
    return ordinals[nth - 1];
}

export default function NovaReservaPage() {
    const supabase = createClient()
    const router = useRouter()
    const [rooms, setRooms] = useState<any[]>([])
    const [recurringType, setRecurringType] = useState('none') // 'none', 'daily', 'weekly', 'monthly', 'annually'
    const [userId, setUserId] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedDate, setSelectedDate] = useState<string>(() => {
        const today = new Date()
        return today.toLocaleDateString('en-CA') // YYYY-MM-DD local version
    })

    // Gerar labels dinâmicas
    const parsedDate = new Date(`${selectedDate}T12:00:00`)
    const dayOfWeekName = format(parsedDate, 'EEEE', { locale: ptBR })
    const dayOfMonth = format(parsedDate, 'd')
    const monthName = format(parsedDate, 'MMMM', { locale: ptBR })
    const weekOfMonthOrdinal = getWeekOfMonthOrdinal(parsedDate)

    async function handleAction(formData: FormData) {
        if (!formData.get('room_id')) {
            toast.error('Por favor, selecione uma sala.')
            return
        }

        setIsSubmitting(true)
        try {
            const res = await createReservation(formData)
            if (res?.error) {
                toast.error(res.error)
                setIsSubmitting(false)
            } else if (res?.success) {
                toast.success('Reserva confirmada!')
                router.push('/dashboard')
            }
        } catch (e) {
            toast.error('Ocorreu um problema ao enviar.')
            setIsSubmitting(false)
        }
    }

    useEffect(() => {
        async function loadData() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }
            setUserId(user.id)

            const { data: roomsData } = await supabase.from('rooms').select('*').eq('is_active', true)
            if (roomsData) setRooms(roomsData)
        }
        loadData()
    }, [supabase, router])

    if (!userId) return null; // Loading state básico

    return (
        <div className="flex h-screen w-full flex-col p-4 space-y-4 max-w-md mx-auto">
            <header className="flex items-center py-2 space-x-2">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <h1 className="text-xl font-bold tracking-tight">Nova Reserva</h1>
            </header>

            <main className="flex-1 overflow-y-auto pb-6">
                <form action={handleAction}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Detalhes da Agenda</CardTitle>
                            <CardDescription>
                                Selecione a sala e os horários que você precisa.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="room_id">Sala</Label>
                                <Select name="room_id">
                                    <SelectTrigger id="room_id">
                                        <SelectValue placeholder="Escolha a sala..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {rooms?.map((room) => (
                                            <SelectItem key={room.id} value={room.id}>
                                                {room.name} (Capac. {room.capacity})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="title">Título / Motivo</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    placeholder="Ex: Ensaio Coral, Reunião de Líderes"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="date">Data Inicial</Label>
                                    <div className="relative">
                                        <Input
                                            id="date"
                                            name="date"
                                            type="date"
                                            required
                                            className="w-full"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="start_time">Hora Início</Label>
                                    <div className="relative">
                                        <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input id="start_time" name="start_time" type="time" required className="pl-9" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="end_time">Hora Fim</Label>
                                    <div className="relative">
                                        <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input id="end_time" name="end_time" type="time" required className="pl-9" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-muted/50 p-4 rounded-lg space-y-3 mt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="recurring_type">Recorrência</Label>
                                    <Select
                                        name="recurring_type"
                                        value={recurringType}
                                        onValueChange={setRecurringType}
                                    >
                                        <SelectTrigger id="recurring_type">
                                            <SelectValue placeholder="Selecione a repetição" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Não se repete</SelectItem>
                                            <SelectItem value="daily">Todos os dias</SelectItem>
                                            <SelectItem value="weekly">Semanalmente, a cada {dayOfWeekName}</SelectItem>
                                            <SelectItem value="monthly">Mensalmente no dia {dayOfMonth}</SelectItem>
                                            <SelectItem value="monthly_weekday">Mensalmente, no {weekOfMonthOrdinal} {dayOfWeekName}</SelectItem>
                                            <SelectItem value="annually">Anualmente em {dayOfMonth} de {monthName}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {recurringType !== 'none' && (
                                    <div className="pt-3 border-t space-y-2">
                                        <Label htmlFor="recurring_end_date">Até quando?</Label>
                                        <Input
                                            id="recurring_end_date"
                                            name="recurring_end_date"
                                            type="date"
                                            required={recurringType !== 'none'}
                                            className="w-full"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-lg flex items-start space-x-3 text-sm mt-4 border border-blue-100 dark:border-blue-900">
                                <Info className="h-6 w-6 text-blue-500 shrink-0" />
                                <p className="text-muted-foreground text-xs leading-relaxed">
                                    Se em algum dos dias a sala estiver reservada por outro departamento,
                                    o sistema bloqueará **todas** as requisições deste lote para evitar confusão.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle>Recursos Adicionais</CardTitle>
                            <CardDescription>
                                Selecione se você precisará das equipes de apoio.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-md hover:bg-muted/50">
                                <Input type="checkbox" name="needs_portaria" className="w-5 h-5" defaultChecked />
                                <div className="space-y-1">
                                    <p className="font-medium text-sm">Avisar Portaria</p>
                                    <p className="text-xs text-muted-foreground">O irmão da portaria precisa abrir a igreja para você</p>
                                </div>
                            </label>

                            <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-md hover:bg-muted/50">
                                <Input type="checkbox" name="needs_sound" className="w-5 h-5" />
                                <div className="space-y-1">
                                    <p className="font-medium text-sm">Avisar Equipe de Som</p>
                                    <p className="text-xs text-muted-foreground">Você precisará usar microfones ou telão</p>
                                </div>
                            </label>
                        </CardContent>

                        <CardFooter className="bg-muted/20 border-t p-4 mt-2">
                            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? 'Verificando...' : 'Confirmar Reserva'}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </main>
        </div>
    )
}
