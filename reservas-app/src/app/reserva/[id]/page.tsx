'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateReservation, deleteReservation } from '../actions'
import Link from 'next/link'
import { ArrowLeft, Clock, Save, Trash2, Info } from 'lucide-react'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'

export default function EditarReservaPage() {
    const supabase = createClient()
    const router = useRouter()
    const params = useParams()

    const [rooms, setRooms] = useState<any[]>([])
    const [reservation, setReservation] = useState<any>(null)
    const [roomId, setRoomId] = useState<string>('')
    const [userId, setUserId] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function loadData() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }
            setUserId(user.id)

            // Buscar salas
            const { data: roomsData } = await supabase.from('rooms').select('*').eq('is_active', true)
            if (roomsData) setRooms(roomsData)

            // Buscar a reserva
            const resId = params.id as string
            const { data: resData, error } = await supabase
                .from('reservations')
                .select('*')
                .eq('id', resId)
                .single()

            if (error || !resData) {
                toast.error('Reserva não encontrada')
                router.push('/dashboard')
                return
            }

            // Somente o dono pode editar
            if (resData.user_id !== user.id) {
                toast.error('Você não tem permissão para editar esta reserva.')
                router.push('/dashboard')
                return
            }

            setReservation(resData)
            setRoomId(resData.room_id)
            setIsLoading(false)
        }
        loadData()
    }, [supabase, router, params.id])

    async function handleAction(formData: FormData) {
        if (!roomId) {
            toast.error('Por favor, selecione uma sala.')
            return
        }

        // Forçar a injeção do room_id no formData já que o Select Controlado pode não enviar sozinho dependendo da versão do Radix
        formData.set('room_id', roomId)
        formData.set('id', params.id as string)

        setIsSubmitting(true)
        try {
            const res = await updateReservation(formData)
            if (res?.error) {
                toast.error(res.error)
                setIsSubmitting(false)
            } else if (res?.success) {
                toast.success('Reserva atualizada!')
                router.push('/dashboard')
            }
        } catch (e) {
            toast.error('Ocorreu um problema ao enviar.')
            setIsSubmitting(false)
        }
    }

    if (isLoading) return <div className="p-10 text-center">Carregando...</div>;

    // Formatar datas para o input nativo (YYYY-MM-DD e HH:mm)
    const startDate = new Date(reservation.start_time)
    const endDate = new Date(reservation.end_time)

    // Gambiarra pra fuso local no input
    const dateStr = startDate.toLocaleDateString('en-CA') // Forma fácil de pegar YYYY-MM-DD local
    const startHora = startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const endHora = endDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

    return (
        <div className="flex h-screen w-full flex-col p-4 space-y-4 max-w-md mx-auto">
            <header className="flex items-center py-2 space-x-2">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <h1 className="text-xl font-bold tracking-tight">Editar Reserva</h1>
            </header>

            <main className="flex-1 overflow-y-auto pb-6">
                <form action={handleAction}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Detalhes da Agenda</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="room_id">Sala</Label>
                                <Select value={roomId} onValueChange={setRoomId}>
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
                                    defaultValue={reservation.title}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="date">Data da Reserva</Label>
                                    <div className="relative">
                                        <Input id="date" name="date" type="date" defaultValue={dateStr} required className="w-full" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="start_time">Hora Início</Label>
                                    <div className="relative">
                                        <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input id="start_time" name="start_time" type="time" defaultValue={startHora} required className="pl-9" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="end_time">Hora Fim</Label>
                                    <div className="relative">
                                        <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input id="end_time" name="end_time" type="time" defaultValue={endHora} required className="pl-9" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle>Recursos Adicionais</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-md hover:bg-muted/50">
                                <Input type="checkbox" name="needs_portaria" className="w-5 h-5" defaultChecked={reservation.needs_portaria} />
                                <div className="space-y-1">
                                    <p className="font-medium text-sm">Avisar Portaria</p>
                                    <p className="text-xs text-muted-foreground">O irmão da portaria precisa abrir a igreja para você</p>
                                </div>
                            </label>

                            <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-md hover:bg-muted/50">
                                <Input type="checkbox" name="needs_sound" className="w-5 h-5" defaultChecked={reservation.needs_sound} />
                                <div className="space-y-1">
                                    <p className="font-medium text-sm">Avisar Equipe de Som</p>
                                    <p className="text-xs text-muted-foreground">Você precisará usar microfones ou telão</p>
                                </div>
                            </label>
                        </CardContent>

                        <CardFooter className="bg-muted/20 border-t p-4 mt-2">
                            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                                <Save className="w-4 h-4 mr-2" />
                                {isSubmitting ? 'Salvando...' : 'Atualizar Reserva'}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>

                <form action={deleteReservation} className="mt-8">
                    <input type="hidden" name="id" value={reservation.id} />
                    <Button variant="destructive" type="submit" className="w-full">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir Reserva
                    </Button>
                </form>
            </main>
        </div>
    )
}
