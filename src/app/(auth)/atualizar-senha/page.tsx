import { updatePassword } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'

export default function AtualizarSenhaPage() {
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
                    <CardTitle className="text-2xl">Nova Senha</CardTitle>
                    <CardDescription className="text-center">
                        Defina sua nova senha de acesso abaixo.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={updatePassword}>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="password">Nova Senha</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full">
                                Salvar Senha
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
