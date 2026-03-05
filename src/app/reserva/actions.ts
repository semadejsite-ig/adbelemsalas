'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createReservation(formData: FormData) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const roomId = formData.get('room_id') as string
    const dateStr = formData.get('date') as string
    const startTimeStr = formData.get('start_time') as string
    const endTimeStr = formData.get('end_time') as string

    // Combina data e hora para ISO 8601 UTC
    const start_time = new Date(`${dateStr}T${startTimeStr}:00`).toISOString()
    const end_time = new Date(`${dateStr}T${endTimeStr}:00`).toISOString()

    // Se precisar de recursos
    const needs_sound = formData.get('needs_sound') === 'on'
    const needs_portaria = formData.get('needs_portaria') !== 'off' // Padrão é true na UI

    // Lógica de Recorrência
    const recurringType = formData.get('recurring_type') as string // 'none', 'weekly', 'monthly'
    const recurringEndDateStr = formData.get('recurring_end_date') as string

    const reservationsToInsert = []

    // 1ª Reserva (Sempre existe)
    reservationsToInsert.push({
        room_id: roomId,
        user_id: user.id,
        title: formData.get('title') as string,
        description: formData.get('description') as string || '',
        start_time: start_time,
        end_time: end_time,
        needs_sound,
        needs_portaria
    })

    // Se for recorrente, gerar as próximas datas até o limite
    if (recurringType && recurringType !== 'none' && recurringEndDateStr) {
        let currentDate = new Date(start_time)
        const limitDate = new Date(`${recurringEndDateStr}T23:59:59`)

        while (true) {
            // Avança dependendo do tipo de recorrência
            if (recurringType === 'daily') {
                currentDate.setDate(currentDate.getDate() + 1)
            } else if (recurringType === 'weekly') {
                currentDate.setDate(currentDate.getDate() + 7)
            } else if (recurringType === 'monthly') {
                currentDate.setMonth(currentDate.getMonth() + 1)
            } else if (recurringType === 'monthly_weekday') {
                currentDate = getNextMonthlyWeekday(currentDate);
            } else if (recurringType === 'annually') {
                currentDate.setFullYear(currentDate.getFullYear() + 1)
            }

            // Se passar do limite, para
            if (currentDate > limitDate) break

            const nextStartTime = new Date(currentDate).toISOString()

            // Calcular o end_time correspondente ao próximo dia
            const nextEndTimeObj = new Date(currentDate)
            const [endH, endM] = endTimeStr.split(':')
            nextEndTimeObj.setHours(parseInt(endH, 10), parseInt(endM, 10), 0)
            const nextEndTime = nextEndTimeObj.toISOString()

            reservationsToInsert.push({
                room_id: roomId,
                user_id: user.id,
                title: formData.get('title') as string,
                description: formData.get('description') as string || '',
                start_time: nextStartTime,
                end_time: nextEndTime,
                needs_sound,
                needs_portaria
            })
        }
    }

    // 1. Tentar inserir no banco (Pode ser 1 ou Várias)
    // O PostgreSQL (via schema.sql Exclude GIST) vai bloquear conflitos atomaticamente!
    const { data, error } = await supabase
        .from('reservations')
        .insert(reservationsToInsert)
        .select('*, rooms(name)')

    if (error) {
        // Código de erro do PostgreSQL para Constraint Exclude
        if (error.code === '23P01') {
            return {
                error: 'Conflito de Horário: Um dos dias desta sala já está reservado. Todo o agendamento foi cancelado. Verifique os horários livres no mural geral.'
            }
        }
        return { error: `Erro ao criar reserva(s): ${error.message}` }
    }

    // 2. Se salvou com sucesso, disparar Notificações (Apenas a 1ª Notificação para não fazer spam)
    if (data && data.length > 0 && (needs_sound || needs_portaria)) {
        // Buscando perfil para nomear quem reservou
        const { data: profile } = await supabase.from('profiles').select('full_name, department').eq('id', user.id).single()

        await notifyTelegram(data[0], profile, recurringType, data.length)
    }

    revalidatePath('/dashboard')
    return { success: true }
}

async function notifyTelegram(reservation: any, profile: any, recurringType: string, totalReservas: number) {
    const token = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID

    if (!token || !chatId) return // Ignora se não estiver configurado

    const roomName = reservation.rooms?.name || 'Sala'
    const userName = profile?.full_name || 'Alguém'
    const dept = profile?.department || 'Departamento'

    const dateFormatted = new Date(reservation.start_time).toLocaleDateString('pt-BR')
    const startHora = new Date(reservation.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const endHora = new Date(reservation.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

    let msg = `📅 *NOVA RESERVA CONFIRMADA*\n\n`
    msg += `📍 *Local:* ${roomName}\n`
    msg += `👤 *Líder:* ${userName} (${dept})\n`
    msg += `⏰ *Data/Hora:* ${dateFormatted} das ${startHora} às ${endHora}\n`

    if (recurringType === 'daily') {
        msg += `🔄 *Recorrência:* Todos os dias (${totalReservas} encontros)\n`
    } else if (recurringType === 'weekly') {
        msg += `🔄 *Recorrência:* Toda Semana (${totalReservas} encontros)\n`
    } else if (recurringType === 'monthly' || recurringType === 'monthly_weekday') {
        msg += `🔄 *Recorrência:* Todo Mês (${totalReservas} encontros)\n`
    } else if (recurringType === 'annually') {
        msg += `🔄 *Recorrência:* Todo Ano (${totalReservas} encontros)\n`
    }

    msg += `📝 *Motivo:* ${reservation.title}\n\n`

    if (reservation.needs_sound || reservation.needs_portaria) {
        msg += `⚠️ *ATENÇÃO EQUIPES:*\n`
        if (reservation.needs_portaria) msg += `- 🚪 *Portaria:* Necessário abrir igreja/sala.\n`
        if (reservation.needs_sound) msg += `- 🎧 *Multimídia/Som:* Necessário auxílio com equipamento.\n`
    }

    try {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: msg,
                parse_mode: 'Markdown'
            })
        })
    } catch (e) {
        console.error('Falha ao enviar Telegram', e)
    }
}

export async function updateReservation(formData: FormData) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Usuário não autenticado' }
    }

    const id = formData.get('id') as string
    const roomId = formData.get('room_id') as string
    const dateStr = formData.get('date') as string
    const startTimeStr = formData.get('start_time') as string
    const endTimeStr = formData.get('end_time') as string

    const start_time = new Date(`${dateStr}T${startTimeStr}:00`).toISOString()
    const end_time = new Date(`${dateStr}T${endTimeStr}:00`).toISOString()

    const needs_sound = formData.get('needs_sound') === 'on'
    const needs_portaria = formData.get('needs_portaria') !== 'off'

    const { error } = await supabase
        .from('reservations')
        .update({
            room_id: roomId,
            title: formData.get('title') as string,
            start_time,
            end_time,
            needs_sound,
            needs_portaria
        })
        .eq('id', id)
        .eq('user_id', user.id) // Segurança a nível de rota

    if (error) {
        if (error.code === '23P01') {
            return { error: 'Conflito de Horário ao tentar remarcar.' }
        }
        return { error: `Erro ao atualizar reserva: ${error.message}` }
    }

    revalidatePath('/dashboard')
    return { success: true }
}

export async function deleteReservation(formData: FormData) {
    const supabase = await createClient()
    const id = formData.get('id') as string

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id) // Apenas o dono pode apagar via RLS também

    if (error) {
        redirect(`/reserva/${id}?message=Não foi possível excluir a reserva.`)
    }

    revalidatePath('/dashboard')
    redirect('/dashboard')
}

// ======================= HELPER DE DATA MENSAL POR DIA DA SEMANA ==========================
function getNextMonthlyWeekday(date: Date) {
    const originalDate = date.getDate();
    const originalDayOfWeek = date.getDay();

    const nth = Math.ceil(originalDate / 7);

    // Testa se esse dia caindo nessa semana era o último daquele mês original
    const nextWeekSameMonth = new Date(date);
    nextWeekSameMonth.setDate(originalDate + 7);
    const isLast = nextWeekSameMonth.getMonth() !== date.getMonth();

    const nextDate = new Date(date);
    nextDate.setMonth(nextDate.getMonth() + 1);

    // Pula para o dia 1 do novo mes
    nextDate.setDate(1);

    // Descobre onde cai o 1o diaDaSemana (ex: primeiro Sabado do mes novo)
    let offset = originalDayOfWeek - nextDate.getDay();
    if (offset < 0) offset += 7;
    nextDate.setDate(1 + offset);

    if (isLast) {
        while (true) {
            const testDate = new Date(nextDate);
            testDate.setDate(testDate.getDate() + 7);
            if (testDate.getMonth() !== nextDate.getMonth()) break;
            nextDate.setDate(nextDate.getDate() + 7);
        }
    } else {
        // Avanca para o N-ésimo sabado daquele mes (ex: se era o 3o sabado, avança 2 semanas a partir do dia 1)
        nextDate.setDate(nextDate.getDate() + (nth - 1) * 7);
    }
    return nextDate;
}
