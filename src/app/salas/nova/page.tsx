import { createRoom } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

export default function NovaSalaPage() {
    return (
        <div className="flex h-screen w-full flex-col p-4 space-y-4 max-w-md mx-auto">
            <header className="flex items-center py-2 space-x-2">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/salas">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <h1 className="text-xl font-bold tracking-tight">Nova Sala</h1>
            </header>

            <main className="flex-1 overflow-y-auto pb-6">
                <form action={createRoom}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Dados da Sala</CardTitle>
                            <CardDescription>
                                Informe o nome e a capacidade máxima de pessoas.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome da Sala</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="Ex: Templo Principal"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="capacity">Capacidade (Pessoas)</Label>
                                <Input
                                    id="capacity"
                                    name="capacity"
                                    type="number"
                                    min="1"
                                    placeholder="Ex: 50"
                                    required
                                />
                            </div>

                            <div className="flex items-center space-x-3 pt-4 border-t">
                                <Input type="checkbox" id="is_active" name="is_active" className="w-5 h-5 flex-none" defaultChecked />
                                <div className="space-y-1">
                                    <p className="font-medium text-sm leading-none">Sala Ativa</p>
                                    <p className="text-xs text-muted-foreground">Pode ser reservada?</p>
                                </div>
                            </div>

                        </CardContent>
                        <CardFooter className="bg-muted/20 border-t p-4 mt-2">
                            <Button type="submit" size="lg" className="w-full">
                                <Save className="w-4 h-4 mr-2" />
                                Cadastrar Sala
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </main>
        </div>
    )
}
