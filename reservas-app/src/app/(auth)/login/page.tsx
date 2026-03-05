import { login } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import Link from 'next/link'

import Image from 'next/image'

export default function LoginPage() {
    return (
        <div className="flex h-screen w-full items-center justify-center px-4">
            <Card className="mx-auto max-w-sm w-full">
                <CardHeader className="flex flex-col items-center">
                    <Image
                        src="/LOGO OFICIAL ADBELEMSJC.png"
                        alt="ADBelém Logo"
                        width={100}
                        height={100}
                        className="mb-4 object-contain drop-shadow-md"
                        priority
                    />
                    <CardTitle className="text-2xl">Login</CardTitle>
                    <CardDescription className="text-center">
                        Entre com seu e-mail para agendar salas
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={login}>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="m@exemplo.com"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Senha</Label>
                                    <Link href="/esqueci-senha" className="ml-auto inline-block text-sm underline">
                                        Esqueceu a senha?
                                    </Link>
                                </div>
                                <Input id="password" name="password" type="password" required />
                            </div>
                            <Button type="submit" className="w-full">
                                Entrar
                            </Button>
                        </div>
                    </form>
                </CardContent>
                <CardFooter>
                    <div className="mt-4 text-center text-sm w-full">
                        Não tem uma conta?{' '}
                        <Link href="/registro" className="underline">
                            Solicitar acesso
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
