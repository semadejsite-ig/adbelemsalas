import { signup } from '../login/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import Link from 'next/link'

import Image from 'next/image'

export default function RegisterPage() {
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
                    <CardTitle className="text-2xl">Criar Conta</CardTitle>
                    <CardDescription className="text-center">
                        Cadastre-se para reservar salas na ADBelém.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={signup}>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="full_name">Nome Completo</Label>
                                <Input
                                    id="full_name"
                                    name="full_name"
                                    placeholder="João da Silva"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="department">Departamento</Label>
                                <Input
                                    id="department"
                                    name="department"
                                    placeholder="Jovens, Kids, Som..."
                                    required
                                />
                            </div>
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
                                <Label htmlFor="password">Senha</Label>
                                <Input id="password" name="password" type="password" required />
                            </div>
                            <Button type="submit" className="w-full">
                                Cadastrar
                            </Button>
                        </div>
                    </form>
                </CardContent>
                <CardFooter>
                    <div className="mt-4 text-center text-sm w-full">
                        Já possui acesso?{' '}
                        <Link href="/login" className="underline">
                            Fazer Login
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
