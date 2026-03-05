'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    // type-casting here for convenience
    // in practice, you should validate your inputs
    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        redirect('/login?message=Não foi possível autenticar o usuário')
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        options: {
            data: {
                full_name: formData.get('full_name') as string,
                department: formData.get('department') as string,
            }
        }
    }

    const { error } = await supabase.auth.signUp(data)

    if (error) {
        redirect('/registro?message=Não foi possível criar a conta')
    }

    redirect('/login?message=Conta criada com sucesso! Verifique sua caixa de entrada para confirmar o e-mail antes de acessar.')
}

export async function resetPassword(formData: FormData) {
    const supabase = await createClient()
    const email = formData.get('email') as string

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/atualizar-senha`,
    })

    if (error) {
        redirect('/esqueci-senha?message=Falha ao processar o e-mail')
    }

    redirect('/login?message=Verifique seu e-mail para continuar')
}
