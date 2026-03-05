'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function updatePassword(formData: FormData) {
    const supabase = await createClient()
    const password = formData.get('password') as string

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
        redirect('/atualizar-senha?message=Falha ao atualizar a senha')
    }

    redirect('/dashboard?message=Senha atualizada com sucesso')
}
