import { resetPassword } from '../login/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import Link from 'next/link'
import Image from 'next/image'

export default function EsqueciSenhaPage() {
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
                    <CardTitle className="text-2xl">Recuperar Senha</CardTitle>
                    <CardDescription className="text-center">
                        Digite seu e-mail cadastrado e enviaremos um link de recuperação.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={resetPassword}>
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
                            <Button type="submit" className="w-full">
                                Enviar E-mail
                            </Button>
                        </div>
                    </form>
                </CardContent>
                <CardFooter>
                    <div className="mt-4 text-center text-sm w-full">
                        Lembrou da senha?{' '}
                        <Link href="/login" className="underline">
                            Voltar ao Login
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
