'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createRoom(formData: FormData) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const name = formData.get('name') as string
    const capacity = parseInt(formData.get('capacity') as string)
    const is_active = formData.get('is_active') === 'on'

    const { error } = await supabase.from('rooms').insert({
        name,
        capacity,
        is_active
    })

    if (error) {
        redirect('/salas/nova?message=Erro ao criar sala')
    }

    revalidatePath('/salas')
    redirect('/salas')
}

export async function updateRoom(formData: FormData) {
    const supabase = await createClient()
    const roomId = formData.get('id') as string

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const name = formData.get('name') as string
    const capacity = parseInt(formData.get('capacity') as string)
    const is_active = formData.get('is_active') === 'on'

    const { error } = await supabase
        .from('rooms')
        .update({ name, capacity, is_active })
        .eq('id', roomId)

    if (error) {
        redirect(`/salas/${roomId}?message=Erro ao atualizar sala`)
    }

    revalidatePath('/salas')
    redirect('/salas')
}

export async function deleteRoom(formData: FormData) {
    const supabase = await createClient()
    const roomId = formData.get('id') as string

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId)

    if (error) {
        redirect(`/salas/${roomId}?message=Não é possível excluir esta sala (possui reservas vinculadas). Considere apenas desativá-la.`)
    }

    revalidatePath('/salas')
    redirect('/salas')
}
